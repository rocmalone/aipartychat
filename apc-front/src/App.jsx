import { useState, useRef, useEffect } from "react";
import axios from "axios";

import "./App.css";
import ChatBox from "./components/ChatBox";

const apiUrl = "http://localhost:3001/api/";

// ** TODO: Make it so that pressing 'Enter' unfocuses the chat bar and lets it fade
//    (i.e. sets isChatInputDisplayed = false)
function App() {
  const [count, setCount] = useState(0);
  const [page, setPage] = useState("");

  const [userName, setUserName] = useState("Dantes");
  const [opponent, setOpponent] = useState("Bacchus");
  const [currentRoll, setCurrentRoll] = useState(100);
  const [gameOver, setGameOver] = useState(0);

  const [userRoll, setUserRoll] = useState(null);

  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const chatWrapperRef = useRef(null);
  const [isChatInputDisplayed, setIsChatInputDisplayed] = useState();

  const [messages, setMessages] = useState([
    {
      name: name,
      className: "roll",
      text: "[System] Type /roll to start playing death roll, or ask Bacchus how to play.",
      aiIgnore: "true",
      owner: "system",
    },
    {
      name: name,
      className: "roll",
      text: "Bacchus joins the party.",
      aiIgnore: "true",
      owner: "ai",
    },
    // {
    //   name: "Bacchus",
    //   text: "I stride through Stormwind, cloak billowing, the shadows embracing me. My past fuels my shadow magic, but my path is now one of redemption. I heal the wounded, fight the darkness. I may be a shadow priest, but I am a force for good. A drink in hand, I toast to my newfound purpose. The Light and the Shadows unite within me. I offer solace to those in pain, hope to those in despair. I am Lawrence Bacchus, the Shadow of Redemption.",
    //   className: "leader",
    //   human: "no",
    // },
  ]);

  useEffect(() => {
    window.addEventListener("keydown", globalHandleKeyPress);
    return () => {
      window.removeEventListener("keydown", globalHandleKeyPress);
    };
  }, []);

  useEffect(() => {
    if (isChatInputDisplayed) {
      inputRef.current.focus();
    }
  }, [isChatInputDisplayed]);

  const globalHandleKeyPress = (e) => {
    if (e.key === "Enter") {
      console.log("Enter key captured", isChatInputDisplayed);
      if (!isChatInputDisplayed) {
        console.log("Set to true");
        setIsChatInputDisplayed(true);
      }
    } else if (e.key === "Escape") {
      setIsChatInputDisplayed(false);
    }
  };

  const handleChatInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleChatInputKeyPress = (e) => {
    if (e.key === "Enter") {
      // Try to leave focus
      inputRef.current.blur();
      chatWrapperRef.current.focus();

      const newText = e.target.value;

      const validRollCommands = ["/roll", "/random", "/rand"];
      const splitText = newText.split(" ");
      if (validRollCommands.includes(splitText[0])) {
        let min = 1;
        let max = 100;
        if (splitText[1]) {
          if (splitText[2]) {
            if (
              !isNaN(parseInt(splitText[1])) &&
              !isNaN(parseInt(splitText[2]))
            ) {
              min = parseInt(splitText[1]);
              max = parseInt(splitText[2]);
            } else if (
              !isNaN(parseInt(splitText[1])) &&
              isNaN(parseInt(splitText[2]))
            ) {
              max = parseInt(splitText[1]);
            }
          } else {
            if (!isNaN(parseInt(splitText[1]))) {
              max = parseInt(splitText[1]);
            } else {
              // Invalid input
            }
          }
        }

        (async () => {
          const res = await axios.post(apiUrl + "callroll", {
            name: userName,
            opponent: "Bacchus",
            messages: messages,
            rollerName: userName,
            min: min,
            max: max,
            owner: "human",
            aiIgnore: "true",
          });
          const callRollValue = res.data.rollValue;
          setMessages([...messages, res.data]);
          // Insert check for === 1 rollValue and human loss here

          const reactionThreshold = 1.1;
          const reactionRand = Math.random();

          if (callRollValue === 1) {
            const loseRes = await axios.post(apiUrl + "lose", {
              name: userName,
              opponent: opponent,
              messages: messages,
              min: min,
              max: max,
              owner: "human",
              aiIgnore: "true",
            });
            const leavesThePartyMessage = {
              name: opponent,
              text: opponent + " leaves the party.",
              className: "roll",
              aiIgnore: "true",
              owner: "ai",
            };
            setMessages([...messages, loseRes.data, leavesThePartyMessage]);
            setGameOver(1);
          }
          // If player is trying to cheat by rolling higher
          else if (max > currentRoll) {
            const cheatRes = await axios.post(apiUrl + "cheatroll", {
              name: userName,
              opponent: opponent,
              messages: messages,
              min: min,
              max: max,
              currentRoll: currentRoll,
              owner: "human",
              aiIgnore: "true",
            });
            setMessages([...messages, cheatRes.data]);
          } else {
            setCurrentRoll(callRollValue);

            let reactionData;
            // If a reaction is triggered
            if (reactionRand >= reactionThreshold) {
              const reactionRes = await axios.post(apiUrl + "reactroll", {
                name: userName,
                opponent: opponent,
                messages: messages,
                min: min,
                max: max,
                currentRoll: currentRoll,
                owner: "human",
                aiIgnore: "true",
                reactTo: "human",
              });
              setMessages([...messages, reactionRes.data]);
              reactionData = reactionRes.data;
            }
            // Get an ai roll response
            const res2 = await axios.post(apiUrl + "resroll", {
              name: userName,
              opponent: opponent,
              messages: messages,
              rollerName: opponent,
              min: min,
              max: callRollValue,
              owner: "ai",
              aiIgnore: "true",
            });
            console.log(reactionData);
            if (reactionData) {
              setMessages([...messages, reactionData, res2.data]);
            } else {
              setMessages([...messages, res2.data]);
            }
            const resRollValue = res2.data.rollValue;
            setCurrentRoll(resRollValue);

            const selfReactionThreshold = 1.1;
            const selfReactionRand = Math.random();
            // Insert check for === 1 rollValue and user win here
            if (resRollValue === 1) {
              const loseRes = await axios.post(apiUrl + "win", {
                name: userName,
                opponent: opponent,
                messages: messages,
                min: min,
                max: max,
                owner: "human",
                aiIgnore: "true",
              });
              const leavesThePartyMessage = {
                name: opponent,
                text: opponent + " leaves the party.",
                className: "roll",
                aiIgnore: "true",
                owner: "ai",
              };
              setMessages([...messages, loseRes.data, leavesThePartyMessage]);
              setGameOver(1);
            }
            // else if reaction triggered
            else if (selfReactionRand > selfReactionThreshold) {
              const reactionRes = await axios.post(apiUrl + "reactroll", {
                name: userName,
                opponent: opponent,
                messages: messages,
                min: min,
                max: max,
                currentRoll: resRollValue,
                owner: "human",
                aiIgnore: "true",
                reactTo: "ai",
              });
              setMessages([...messages, reactionRes.data]);
              reactionData = reactionRes.data;
            }
          }
        })();
        e.target.value = "";
      } else if (e.target.value) {
        // Set messages and send to API
        const newMessage = {
          name: userName,
          text: e.target.value,
          className: "leader",
          owner: "human",
        };
        const newMessages = [...messages, newMessage];

        setMessages(newMessages);
        postMessages(newMessages);

        e.target.value = "";
      }
    }
  };

  const postMessages = async (newMessages) => {
    const res = await axios.post(apiUrl + "chat", { messages: newMessages });

    setMessages([...newMessages, res.data]);
    console.log(res.data);
  };

  const postRoll = async (newMessages) => {};

  console.log("RENDER All messages: ", messages);

  const handleUserNameInputSubmit = (e) => {
    setUserName(e.target.value);
    console.log("User name set to ", e.target.value);
  };

  if (!userName) {
    return (
      <div className="content">
        <div className="nameSelectWrapper">
          <span>My name is </span>
          <input
            className="nameInput"
            type="text"
            onSubmit={handleUserNameInputSubmit}
          ></input>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="chatWrapper" ref={chatWrapperRef}>
        <ChatBox messages={messages} />
        {gameOver === 0 && (
          <div
            className="chatbar"
            onClick={() => {
              setIsChatInputDisplayed(true);
            }}
          >
            {isChatInputDisplayed && (
              <>
                <img className="chatbarImage" src="chatbar.png"></img>
                <div className="chatbarText">
                  <span>Party: </span>
                  <input
                    className="chatbarInput"
                    type="text"
                    onChange={handleChatInputChange}
                    onBlur={() => {
                      setIsChatInputDisplayed(false);
                    }}
                    onKeyDown={handleChatInputKeyPress}
                    ref={inputRef}
                  ></input>
                </div>
              </>
            )}
            {!isChatInputDisplayed && (
              <img className="chatbarImage faded" src="chatbar.png"></img>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
