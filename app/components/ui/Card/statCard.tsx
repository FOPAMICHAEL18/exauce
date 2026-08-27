interface statProps {
    statName: string,
    statValue: number | string
}

const statCard = ({statName, statValue}: statProps) => {

    const names: Record<string, string> = {
        'AVIS MASQUES': 'text-3xl font-bold mt-2 text-orange-500'
    }

    const css = names[statName] || 'text-3xl font-bold mt-2 text-gray-800'

    return (
        <div className='p-6 rounded-lg border border-gray-200 bg-white'>
            <p className='text-sm text-gray-500 font-medium'>{statName}</p>
            <p className={`${css}`}>{statValue}</p>
        </div>
    )
}

export default statCard