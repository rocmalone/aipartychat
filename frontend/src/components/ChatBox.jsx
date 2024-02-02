import styles from "./ChatBox.module.css";
import { useRef, useEffect, useState } from "react";

function ChatBox({ messages, enableChatInput, disableChatInput }) {
  const chatboxRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [queue, setQueue] = useState([]);

  const messagesInIntro = 5;

  let newQueue = [...queue];
  messages.map((message, index) => {
    // console.log("Mapping msg 1");
    if (!displayedMessages.includes(message) && !queue.includes(message)) {
      if (message.text.startsWith('"') && message.text.endsWith('"')) {
        message.text = message.text.substring(1, message.text.length - 1);
      }
      newQueue.push(message);
    }
  });

  useEffect(() => {
    setQueue([...newQueue]);
  }, [messages]);

  useEffect(() => {
    // Scroll to the bottom of the chat box when messages are updated
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }

    let typingDelay = 400;
    // console.log("Queue @ start of effect:", queue);
    if (queue[0]) {
      if (queue[0].owner === "human" || queue[0].delay === "false") {
        const newDisplayedMessages = [...displayedMessages, queue[0]];
        setDisplayedMessages(newDisplayedMessages);
        const newQueue = queue.slice(1);
        setQueue([...newQueue]);
        // console.log("Queue @ end of effect:", newQueue);
      } else {
        const delay = async () => {
          if (queue[0].delay) {
            typingDelay = queue[0].delay;
          }

          await setTimeout(() => {
            const newDisplayedMessages = [...displayedMessages, queue[0]];
            setDisplayedMessages(newDisplayedMessages);
            const newQueue = queue.slice(1);
            setQueue([...newQueue]);
            // console.log("Queue @ end of effect:", newQueue);
          }, typingDelay);
        };
        delay();
      }

      // Turn off chat box after human message
      // Turn back on after ai or roll
      setTimeout(() => {
        if (queue[0].owner === "human") {
          disableChatInput();
        }
        // Hacky way to enable the chat bar only after the intro
        else if (displayedMessages >= messagesInIntro) {
          enableChatInput();
        }
      }, 500);
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
