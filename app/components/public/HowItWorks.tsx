import StepCard from "../ui/Card/StepCard";

interface Step {
  stepNumber: number;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    stepNumber: 1,
    title: "Parcourez le catalogue",
    description: "Filtrez par catégorie, prix ou arrivages (Chine & Turquie) pour trouver vos articles préférés.",
  },
  {
    stepNumber: 2,
    title: "Consultez la fiche produit",
    description: "Découvrez les photos réelles, les détails techniques, le prix clair en FCFA et la disponibilité en stock.",
  },
  {
    stepNumber: 3,
    title: "contactez-nous",
    description: "Cliquez sur le bouton WhatsApp ou téléphone pour échanger directement, réserver ou poser vos questions.",
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
                        <StepCard step={step} key={step.stepNumber} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HowItWorks