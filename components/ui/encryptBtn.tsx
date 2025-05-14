'use client'
import type { HTMLProps } from 'react'
import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface EncryptButtonProps extends HTMLProps<HTMLButtonElement> {
  onClick?: () => void
  TARGET_TEXT: string
  disabled?: boolean
}

function EncryptButton({ TARGET_TEXT, onClick, disabled }: EncryptButtonProps): React.JSX.Element {
  // const TARGET_TEXT = 'Join Waitlist'
  const CYCLES_PER_LETTER = 2
  const SHUFFLE_TIME = 50

  const CHARS = '!@#$%^&*():{};|,.<>/?'

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [text, setText] = useState(TARGET_TEXT)

  const scramble = (): void => {
    let pos = 0

    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split('')
        .map((char, index) => {
          if (pos / CYCLES_PER_LETTER > index) {
            return char
          }

          const randomCharIndex = Math.floor(Math.random() * CHARS.length)
          const randomChar = CHARS[randomCharIndex]

          return randomChar
        })
        .join('')

      setText(scrambled)
      pos++

      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) {
        stopScramble()
      }
    }, SHUFFLE_TIME)
  }

  const stopScramble = (): void => {
    clearInterval(intervalRef.current || undefined)

    setText(TARGET_TEXT)
  }

  return (
    <motion.button
      className="relative overflow-hidden rounded-full px-4 py-2 md:text-lg text-sm p-2 border dark:border-gray-300 border-black font-bold uppercase dark:text-white text-black transition-colors"
      onMouseEnter={scramble}
      onMouseLeave={stopScramble}
      onClick={onClick}
      whileHover={{
        scale: 1.025
      }}
      whileTap={{
        scale: 0.975
      }}
    >
      <div className="relative z-10 flex items-center gap-2">
        <span className="flex">
          {text}
        </span>
      </div>
      <motion.span
        animate={{
          y: '-100%'
        }}
        className="absolute inset-0 z-0 scale-125 bg-gradient-to-t from-40% to-60% opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        initial={{
          y: '100%'
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'mirror',
          duration: 1,
          ease: 'linear'
        }}
      />
    </motion.button>
  )
}

export default EncryptButton