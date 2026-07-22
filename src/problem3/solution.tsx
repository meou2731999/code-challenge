// 1. `WalletBalance` omits `blockchain`, yet the code reads `balance.blockchain`.
interface WalletBalance {
  currency: string;
  amount: number;
}
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

// 2. Empty `interface Props extends BoxProps {}` adds no value — use `BoxProps` (or omit the alias entirely).
interface Props extends BoxProps {}
// 3. Redundant typing: `React.FC<Props>` plus `(props: Props)`.
const WalletPage: React.FC<Props> = (props: Props) => {
  // 4. `children` is destructured from props but never rendered or used.
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // 5. `getPriority` is recreated every render; it is pure and should live outside the component (or be a module-level constant map lookup).
  // 6. `blockchain: any` disables type safety; should be a string union of known chains.
  const getPriority = (blockchain: any): number => {
    switch (blockchain) {
      case "Osmosis":
        return 100;
      case "Ethereum":
        return 50;
      case "Arbitrum":
        return 30;
      case "Zilliqa":
        return 20;
      case "Neo":
        return 20;
      default:
        return -99;
    }
  };

  // 7. Three separate passes over the list (filter/sort → format map → rows map). Format + row creation can be a single pass after sorting.
  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        // 8. Priority is recomputed many times (filter + both sides of every sort compare). Compute once per balance then sort.
        const balancePriority = getPriority(balance.blockchain);
        // 9. Undefined variable in filter: uses `lhsPriority` but declares `balancePriority` → ReferenceError at runtime.
        if (lhsPriority > -99) {
          // 10. Filter logic is inverted: keeps balances with amount <= 0 for known chains. Likely intent: keep amount > 0 and priority > -99.
          if (balance.amount <= 0) {
            return true;
          }
        }
        return false;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        // 8 (cont). Priority recomputed again on both sides of every comparison.
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        if (leftPriority > rightPriority) {
          return -1;
        } else if (rightPriority > leftPriority) {
          return 1;
        }
        // 11. Sort comparator does not return 0 when priorities are equal → unstable / undefined comparator result.
      });
    // 12. `useMemo` depends on `prices`, but the memoized work never uses `prices` → unnecessary re-filter/re-sort whenever prices change.
  }, [balances, prices]);

  // 13. `formattedBalances` is built then never used.
  // 14. `formattedBalances` is not memoized; allocates a new array every render even when inputs are unchanged.
  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed(),
    };
  });

  // 13 (cont). `rows` maps `sortedBalances` and treats items as `FormattedWalletBalance`, so `balance.formatted` is undefined.
  // 14 (cont). `rows` is not memoized; allocates new arrays/elements every render.
  const rows = sortedBalances.map(
    (balance: FormattedWalletBalance, index: number) => {
      // 15. No guard when `prices[currency]` is missing → `undefined * amount` yields NaN.
      const usdValue = prices[balance.currency] * balance.amount;
      return (
        <WalletRow
          // 16. `classes` is referenced but never defined in this snippet (missing import / styles).
          className={classes.row}
          // 17. `key={index}` is unstable if order/filter changes; prefer a stable id (e.g. `${blockchain}-${currency}`).
          key={index}
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    },
  );

  return <div {...rest}>{rows}</div>;
};
