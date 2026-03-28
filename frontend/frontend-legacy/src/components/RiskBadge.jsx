const RiskBadge = ({ level }) => {
  const styles = {
    LOW: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
    HIGH: 'bg-red-50 text-red-700 border border-red-200',
    CRITICAL: 'bg-red-100 text-red-800 border border-red-300 animate-pulse',
  };

  return (
    <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${styles[level] || styles.MEDIUM}`}>
      {level}
    </span>
  );
};

export default RiskBadge;
