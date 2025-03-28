"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: "How does Inkr find research projects?",
    answer: "Inkr uses advanced algorithms to search the NIH database (RePORTER) in real-time, finding active research projects based on your specific keywords, methodologies, and research areas."
  },
  {
    question: "Is cold emailing PIs allowed?",
    answer: "Yes, contacting PIs about research collaboration is acceptable and common in academia. Inkr helps you craft personalized, professional emails that respect academic etiquette and privacy guidelines."
  },
  {
    question: "What information can I access about each PI?",
    answer: "You can view public grant information, research abstracts, funding amounts, institution details, and publication history. All data is sourced from public NIH databases."
  },
  {
    question: "How does the email automation work?",
    answer: "You can set up personalized email templates that automatically populate with relevant research details. You control the sending schedule, and all emails appear to come directly from your email address."
  },
  {
    question: "Can I track response rates?",
    answer: "Yes, Inkr provides detailed analytics including open rates, response rates, and meeting scheduling success rates. You can A/B test different approaches to optimize your outreach."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto">
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          initial={false}
          className="border-b border-gray-200 py-4"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex justify-between items-center w-full text-left"
          >
            <span className="text-lg font-medium">{faq.question}</span>
            <motion.span
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.span>
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="pt-4 text-gray-600">{faq.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
} 