import { useState, useRef, useEffect } from "react";

function ChatInput(props) {
  const inputRef = useRef(null);
  const [input, setInput] = useState("");

  const handleChatInputChange = (e) => {
    props.setInput(e.target.value);
  };

  useEffect(() => {
    if (props.isChatInputDisplayed) {
      inputRef.current.focus();
    }
  }, [isChatInputDisplayed]);

  if (props.isChatInputDisplayed) {
    return (
      <>
        <span>Party: </span>
        <input
          className="chatbarInput"
          type="text"
          onChange={handleChatInputChange}
          onBlur={() => {
            props.onChatInputBlur();
          }}
          ref={inputRef}
        ></input>
      </>
    );
  }
  return <></>;
}

export default ChatInput;
