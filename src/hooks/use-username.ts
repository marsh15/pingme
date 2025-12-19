import { useEffect, useState } from "react";

const NAMES = ["batman", "james bond", "patrick bateman", "aragorn"]
const STORAGE_KEY = "chat_username"

const nanoid = (length: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}


const generateUsername = () => {
  const word = NAMES[Math.floor(Math.random() * NAMES.length)]
  return `anonymous-${word}-${nanoid(5)}`
}

export const useUsername = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setUsername(stored)
      } else {
        const newName = generateUsername()
        localStorage.setItem(STORAGE_KEY, newName)
        setUsername(newName)
      }
    } catch (e) {
      // Fallback if localStorage is disabled/unavailable
      setUsername(generateUsername())
    }
  }, [])

  return username
}