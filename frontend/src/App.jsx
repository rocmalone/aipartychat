import { useState, useRef, useEffect } from "react";
import axios from "axios";

import "./App.css";
import ChatBox from "./components/ChatBox";

const apiUrl = import.meta.env.VITE_API_URL;

//    (i.e. sets isChatInputDisplayed = false)
function App() {
  console.log("API URL: " + apiUrl);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState("");

  const [userName, setUserName] = useState("Dantes");
  const [opponent, setOpponent] = useState("Bacchus");
  const [currentRoll, setCurrentRoll] = useState(100);
  const [gameOver, setGameOver] = useState(0);

  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const chatWrapperRef = useRef(null);
  const [isChatInputDisplayed, setIsChatInputDisplayed] = useState(false);

  const [messages, setMessages] = useState([
    {
      name: name,
      className: "roll",
      text: "[System] Deathroll is a game of chance.",
      aiIgnore: "true",
      owner: "system",
      delay: 500,
    },
    {
      name: name,
      className: "roll",
      text: "[System] Each player rolls a die with a maximum equal to the last roll.",
      aiIgnore: "true",
      owner: "system",
      delay: 1500,
    },
    {
      name: name,
      className: "roll",
      text: "[System] The first player to roll a one loses. Type '/roll 100' to begin.",
      aiIgnore: "true",
      owner: "system",
      delay: 1500,
    },
    {
      name: name,
      className: "roll",
      text: "[System] Bacchus can teach you more, but be wary of handsome rogues.",
      aiIgnore: "true",
      owner: "system",
      delay: 1500,
    },
    {
      name: name,
      className: "roll",
      text: "Bacchus joins the party.",
      aiIgnore: "true",
      owner: "system",
      delay: 1000,
    },
  ]);

  useEffect(() => {
    window.addEventListener("keydown", globalHandleKeyPress);
    setTimeout(() => {
      if (!isChatInputDisplayed) {
        setIsChatInputDisplayed(true);
      }
    }, 8000);

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
    if (e.key === "Enter" && input) {
      console.log("Enter key captured", isChatInputDisplayed);
      if (isChatInputDisplayed) {
        setIsChatInputDisplayed(false);
      }
    } else if (e.key === "Escape") {
      setIsChatInputDisplayed(false);
    }
  };

  const handleChatInputChange = (e) => {
    setInput(e.target.value);
  };

  const handlePlayAgain = (e) => {
    window.location.reload();
  };

  const handleChatInputKeyPress = (e) => {
    if (e.key === "Enter" && input) {
      // Try to leave focus
      disableChatInput();
      inputRef.current.blur();
      chatWrapperRef.current.focus();
      console.log("hit enter");

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
            disableChatInput();
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

  // console.log("RENDER All messages: ", messages);

  const handleUserNameInputSubmit = (e) => {
    setUserName(e.target.value);
    console.log("User name set to ", e.target.value);
  };

  const enableChatInput = () => {
    if (!isChatInputDisplayed) {
      setIsChatInputDisplayed(true);
    }
  };

  const disableChatInput = () => {
    if (isChatInputDisplayed) {
      setIsChatInputDisplayed(false);
    }
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
      <div className="video-container">
        <video id="bg-vid" src="inn_loop.mp4" autoPlay muted loop></video>
      </div>

      <div className="chatWrapper" ref={chatWrapperRef}>
        <div id="bg-chat"></div>
        <ChatBox
          messages={messages}
          enableChatInput={enableChatInput}
          disableChatInput={disableChatInput}
        />
        <div
          className="chatbar"
          // onClick={() => {
          //   setIsChatInputDisplayed(true);
          // }}
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
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  onKeyDown={handleChatInputKeyPress}
                  ref={inputRef}
                  disabled={!isChatInputDisplayed}
                ></input>
              </div>
            </>
          )}
          {!isChatInputDisplayed && (
            <img className="chatbarImage faded" src="chatbar.png"></img>
          )}
        </div>
      </div>
      {gameOver === 1 && (
        <button className="play-again" onClick={handlePlayAgain}>
          Play again?
        </button>
      )}
    </div>
  );
}

export default App;
