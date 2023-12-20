import { useState, useRef, useEffect } from "react";
import axios from "axios";

import "./App.css";

const apiUrl = "http://localhost:3001/api/chat";

// ** TODO: Make it so that pressing 'Enter' unfocuses the chat bar and lets it fade
//    (i.e. sets isChatInputDisplayed = false)
function App() {
  const [count, setCount] = useState(0);
  const [page, setPage] = useState("");

  const [userRace, setUserRace] = useState("");
  const [userGender, setUserGender] = useState("");
  const [userClass, setUserClass] = useState("");
  const [userName, setUserName] = useState("Dantes");

  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const [isChatInputDisplayed, setIsChatInputDisplayed] = useState();

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

  const [messages, setMessages] = useState([
    {
      name: "Bacchus",
      text: "Thanks for accepting inv",
      className: "leader",
      human: "no",
    },
  ]);

  const handleNextButton = () => {
    if (messages.length === 1) {
      setMessages([...messages, message1]);
    } else {
      setMessages([...messages, message2]);
    }
  };

  const handleChatInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleChatInputKeyPress = (e) => {
    if (e.key === "Enter") {
      // Try to leave focus
      inputRef.current.blur();
      // Set messages and send to API
      if (e.target.value) {
        const newMessage = {
          name: userName,
          text: e.target.value,
          className: "member",
          human: "yes",
        };
        const newMessages = [...messages, newMessage];
        setMessages(newMessages);
        postMessages(newMessages);

        e.target.value = "";
      }
    }
  };

  const postMessages = async (newMessages) => {
    const res = await axios.post(apiUrl, { messages: newMessages });
    setMessages([...newMessages, res.data]);
    console.log(res.data);
  };

  return (
    <div className="content">
      <div className="chatWrapper">
        <div className="chat">
          {messages.map((message, index) => {
            return (
              <div key={index} className={message.className}>
                [{message.name}]: {message.text}
              </div>
            );
          })}
        </div>
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
          <button onClick={handleNextButton}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default App;
