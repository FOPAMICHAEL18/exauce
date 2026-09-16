'use client'

interface StepData {
    stepNumber: number,
    title: string,
    description: string
}

interface StepCardProps {
    step: StepData,
}

const StepCard = ({step} : StepCardProps) => {
    return (
        <div
        key={step.stepNumber}
        className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-sm flex flex-col items-start transition-shadow hover:shadow-md"
        >
            <div className="w-9 h-9 rounded-full bg-[#0A1730] text-white font-bold text-sm flex items-center justify-center mb-6 shrink-0">
                {step.stepNumber}
            </div>
            <h3 className="text-base font-bold text-[#0A1730] mb-2">
                {step.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
                {step.description}
            </p>
        </div>
    )
}

export default StepCard