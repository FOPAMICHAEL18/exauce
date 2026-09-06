"use client"

interface Step {
  stepNumber: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    stepNumber: 1,
    title: "Parcourez le catalogue",
    description: "Filtrez par catégorie, arrivage de Chine ou de Turquie, et prix.",
  },
  {
    stepNumber: 2,
    title: "Consultez la fiche produit",
    description: "Découvrez les détails, dimensions, matériaux et stock disponible.",
  },
  {
    stepNumber: 3,
    title: "Commandez ou contactez-nous",
    description: "Passez commande directement ou échangez sur WhatsApp pour réserver.",
  },
]

const HowItWorks = () => {
    return (
        <section className="bg-gray-100 py-16">
            <div className="container mx-auto px-4">
                <div className="mb-10">
                    <span className="text-xs font-semibold tracking-widest text-[#1B5E38] uppercase block">
                        SIMPLE
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0A1730] mt-1">
                        Comment ça marche
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step) => (
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
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HowItWorks