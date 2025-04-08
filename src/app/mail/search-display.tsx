'use client'

import { useAtom } from 'jotai'
import React from 'react'
import { SearchValueAtom } from './search-bar'
import { api } from '@/trpc/react'
import { useDebounceValue } from 'usehooks-ts'
import useThreads from '@/hooks/user-threads'
import DOMPurify from 'dompurify'


const SearchDisplay = () => {
    const [searchValue] = useAtom(SearchValueAtom)
    const search = api.account.searchEmails.useMutation()
    const [debounceSearchValue] = useDebounceValue(searchValue, 500)
    const { accountId } = useThreads()

    React.useEffect(() => {
        if (!accountId) return
        search.mutate({
            accountId,
            query: debounceSearchValue
        })
    }, [debounceSearchValue, accountId])


    return (
        <div className='p-4 max-h-[calc(100vh-50px)] overflow-y-scroll'>
            <div className='flex items-center gap-2 mb-4'>
                <h2 className='text-gray-600 text-sm dark:text-gray-400'>
                    Your search for &quot;{searchValue}&quot; come back with ...
                </h2>
            </div>

            {search.data?.hits?.length === 0 ? (
                <>
                    <p> No results found </p>
                </>
            ) : <>
                <ul className='flex flex-col gap-2'>
                    {search.data?.hits.map(hit => (
                        <li key={hit.id} className='border rounded-md list-none p-4 hover:bg-gray-100 cursor-pointer transition-all dark:hover:bg-gray-900'>
                            <h3 className='text-base font-medium '>
                                {hit.document.title}
                            </h3>
                            <p className='text-sm text-gray-500'>
                                From: {hit.document.from}
                            </p>
                            <p className='text-sm text-gray-500'>
                                To: {hit.document.to.join(', ')}
                            </p>
                            <p className='text-sm mt-2'
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(hit.document.rawBody, { USE_PROFILES: { html: true } })
                                }}>
                            </p>
                        </li>
                    ))}
                </ul>
            </>
            }
        </div>
    )
}

export default SearchDisplay