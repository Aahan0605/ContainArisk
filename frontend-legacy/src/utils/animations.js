export const standardTransition = {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1],
};

export const hoverTransition = {
    duration: 0.2,
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: standardTransition },
    exit: { opacity: 0, y: 20, transition: standardTransition },
};

export const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
};

export const hoverLift = {
    rest: { y: 0, scale: 1, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
    hover: {
        y: -2,
        scale: 1.02,
        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        transition: hoverTransition
    },
};

// Simplified page transition wrapper variant
export const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: standardTransition },
    exit: { opacity: 0, y: -15, transition: standardTransition }
};
