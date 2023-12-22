import styles from "./ChatBox.module.css";
import { useRef, useEffect, useState } from "react";

function ChatBox({ messages }) {
  const chatboxRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [queue, setQueue] = useState([]);

  // useEffect(() => {
  //   setDisplayedMessages([messages]);
  // }, [messages]);

  useEffect(() => {
    // Scroll to the bottom of the chat box when messages are updated
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }

    let newQueue = [...queue];
    messages.map((message, index) => {
      console.log("Mapping msg 1");
      if (!displayedMessages.includes(message) && !queue.includes(message)) {
        if (message.text.startsWith('"') && message.text.endsWith('"')) {
          message.text = message.text.substring(1, message.text.length - 1);
        }
        newQueue.push(message);
      }
    });
    setQueue([...newQueue]);
  }, [messages]);

  useEffect(() => {
    console.log("Queue @ start of effect:", queue);
    if (queue[0]) {
      if (queue[0].owner === "human") {
        const newDisplayedMessages = [...displayedMessages, queue[0]];
        setDisplayedMessages(newDisplayedMessages);
        const newQueue = queue.slice(1);
        setQueue([...newQueue]);
        console.log("Queue @ end of effect:", newQueue);
      } else {
        const typingDelay = Math.random() * 3000;
        setTimeout(() => {
          const newDisplayedMessages = [...displayedMessages, queue[0]];
          setDisplayedMessages(newDisplayedMessages);
          const newQueue = queue.slice(1);
          setQueue([...newQueue]);
          console.log("Queue @ end of effect:", newQueue);
        }, typingDelay);
      }
    }
  }, [queue]);

  return (
    <div className="chat" ref={chatboxRef}>
      {displayedMessages.map((message, index) => {
        if (message.text.startsWith("/")) {
          return;
        }
        return (
          <div key={index} className={message.className}>
            {message.className === "leader" && <span>[Party Leader] </span>}
            {message.className === "member" && <span>[Party] </span>}
            {message.className !== "roll" && <span>[{message.name}]: </span>}
            {message.text}
          </div>
        );
      })}
    </div>
  );
}

export default ChatBox;
