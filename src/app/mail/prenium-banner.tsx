import { FREE_CREDITS_PER_DAY } from '@/constants'
import React from 'react'
import StripeButton from './stripe-button'
import { getSubscriptionStatus } from '@/lib/stripe-actions'
import { motion } from 'framer-motion'
import { api } from '@/trpc/react'
import useThreads from '@/hooks/user-threads'


const PreniumBanner = () => {
    const [isSubscribed, setIsSubscribed] = React.useState(false)
    const { accountId } = useThreads()
    const { data } = api.account.getChatbotInteraction.useQuery({
        accountId
    })

    React.useEffect(() => {
        (async () => {
            const subscriptionStatus = await getSubscriptionStatus()
            setIsSubscribed(subscriptionStatus)
        })()
    }, [])

    if (!isSubscribed) return (
        <div className='bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4'>
            <img src='/bot.webp' className='md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto' />
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-white text-xl font-semibold">Basic Plan</h1>
                    <p className="text-gray-400 text-sm md:max-w-full">
                        {data?.remainingCredits} / {FREE_CREDITS_PER_DAY} messages remaining
                    </p>
                </div>
                <div className="h-4"></div>
                <p className='text-gray-400 text-sm md:max-w-[calc(100%-150px)]'>
                    Upgrade to pro to unlock unlimited interactions!
                </p>
                <div className="h-4"></div>
                <StripeButton />
            </div>
        </div>
    )
    if (isSubscribed) return (
        <motion.div layout className="bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4">
            <img src='/bot.webp' className='md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto' />
            <div>
                <h1 className='text-white text-xl font-semibold'>Premium Plan</h1>
                <div className="h-2"></div>
                <p className='text-gray-400 text-sm md:max-w-[calc(100%-70px)]'>Ask as many questions as you want</p>
                <div className="h-4"></div>
                <StripeButton />
            </div>
        </motion.div>
    )
    return (
        <div>PreniumBanner</div>
    )
}

export default PreniumBanner