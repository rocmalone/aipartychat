import styles from "./ChatBox.module.css";
import { useRef, useEffect, useState } from "react";

function ChatBox({ messages }) {
  const chatboxRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [queue, setQueue] = useState([]);

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

  useEffect(() => {
    // Scroll to the bottom of the chat box when messages are updated
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
    setQueue([...newQueue]);
  }, [messages]);

  useEffect(() => {
    console.log("Queue @ start of effect:", queue);
    if (queue[0]) {
      if (queue[0].owner === "human" || queue[0].delay === "false") {
        const newDisplayedMessages = [...displayedMessages, queue[0]];
        setDisplayedMessages(newDisplayedMessages);
        const newQueue = queue.slice(1);
        setQueue([...newQueue]);
        console.log("Queue @ end of effect:", newQueue);
      } else {
        const delay = async () => {
          const typingDelay = Math.random() * 1500;

          setTimeout(() => {
            const newDisplayedMessages = [...displayedMessages, queue[0]];
            setDisplayedMessages(newDisplayedMessages);
            const newQueue = queue.slice(1);
            setQueue([...newQueue]);
            // console.log("Queue @ end of effect:", newQueue);
          }, typingDelay);
        };
        delay();
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
