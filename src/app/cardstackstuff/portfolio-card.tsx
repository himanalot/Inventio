import Image from "next/image"
import { cn } from "@/lib/utils"
import { LucideIcon, ChevronRight, BookOpen } from "lucide-react"

interface PortfolioCardProps {
  ticker: string
  companyName: string
  logoUrl: string
  icon: LucideIcon
  logoBlurColor: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
  brokerLogoUrl: string
  brokerName: string
  onClick?: () => void
}

export function PortfolioCard({
  ticker,
  companyName,
  icon: Icon,
  logoBlurColor,
  price,
  change,
  changePercent,
  isPositive,
  brokerLogoUrl,
  brokerName,
  onClick
}: PortfolioCardProps) {
  // Check if this is the Library card
  const isLibraryCard = ticker === "LIB";
  
  return (
    <button 
      className="w-[486px] h-16 bg-white border border-gray-200 rounded-2xl px-5 flex items-center justify-between shadow-sm transition-colors duration-250 overflow-hidden outline-none appearance-none cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-center gap-[18px]">
        <div className="relative grid w-[32px] h-[32px] place-content-center border border-gray-200 rounded-[7px] bg-indigo-50">
          <Icon className={cn(
            "w-5 h-5 text-indigo-700",
            Icon === BookOpen && "w-[18px] h-[18px]"
          )} />
        </div>
        <div className="flex flex-col leading-[1.1] text-left">
          <strong className="text-[14px] text-gray-800">
            {ticker}
          </strong>
          <span className="text-[14px] text-gray-600">
            {companyName}
          </span>
        </div>
      </div>
      
      {/* For library card only, show the right side with icon and divider */}
      {isLibraryCard && (
        <div className="flex items-center gap-[20.5px]">
          <div className="text-right text-[13.25px] leading-[1] flex flex-col">
            <strong className="text-gray-700">{price}</strong>
            <span className="flex items-center gap-[2px]">
              <span className={cn(isPositive ? "text-[#4EBE96]" : "text-[#D84F68]")}>
                {change}
              </span>
              <span className={isPositive ? "text-[#4EBE96]" : "text-[#D84F68]"}>
                {changePercent}
              </span>
            </span>
          </div>
          <div className="w-[1px] h-[28px] bg-gray-200" />
          <div className="grid w-[24px] h-[28px] place-content-center">
            <ChevronRight className="w-5 h-5 text-indigo-700" />
          </div>
        </div>
      )}
    </button>
  )
}

