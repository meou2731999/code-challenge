/**
 * Computational inefficiencies & anti-patterns in question.tsx
 *
 * --- Bugs / incorrect logic ---
 * 1. Undefined variable in filter: uses `lhsPriority` but declares `balancePriority`
 *    → ReferenceError at runtime.
 * 2. Filter logic is inverted: keeps balances with amount <= 0 for known chains.
 *    Likely intent: keep amount > 0 and priority > -99 (exclude dust / unknown chains).
 * 3. `WalletBalance` omits `blockchain`, yet the code reads `balance.blockchain`.
 * 4. Sort comparator does not return 0 when priorities are equal → unstable / undefined
 *    comparator result (TypeScript also flags this).
 * 5. `formattedBalances` is built then never used; `rows` maps `sortedBalances` and
 *    treats items as `FormattedWalletBalance`, so `balance.formatted` is undefined.
 * 6. `children` is destructured from props but never rendered or used.
 *
 * --- TypeScript anti-patterns ---
 * 7. `blockchain: any` disables type safety; should be a string union of known chains.
 * 8. Empty `interface Props extends BoxProps {}` adds no value — use `BoxProps` (or
 *    omit the alias entirely).
 * 9. Redundant typing: `React.FC<Props>` plus `(props: Props)`.
 *
 * --- Computational inefficiencies ---
 * 10. `getPriority` is recreated every render; it is pure and should live outside the
 *     component (or be a module-level constant map lookup).
 * 11. `useMemo` depends on `prices`, but the memoized work never uses `prices` →
 *     unnecessary re-filter/re-sort whenever prices change.
 * 12. Priority is recomputed many times (filter + both sides of every sort compare).
 *     Compute once per balance (e.g. decorate with priority, or a Map) then sort.
 * 13. Three separate passes over the list (filter/sort → format map → rows map).
 *     Format + row creation can be a single pass after sorting.
 * 14. `formattedBalances` / `rows` are not memoized; they allocate new arrays/elements
 *     every render even when inputs are unchanged.
 *
 * --- React anti-patterns ---
 * 15. `key={index}` is unstable if order/filter changes; prefer a stable id
 *     (e.g. `${blockchain}-${currency}`).
 * 16. No guard when `prices[currency]` is missing → `undefined * amount` yields NaN.
 * 17. `classes` is referenced but never defined in this snippet (missing import / styles).
 */

import React, { useMemo, type HTMLAttributes, type ReactNode } from "react";

// --- Mocks for missing dependencies from the original snippet ---
type BoxProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

const useWalletBalances = (): WalletBalance[] => [];
const usePrices = (): Record<string, number> => ({});

const classes = { row: "wallet-row" };

interface WalletRowProps {
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}

const WalletRow = (_props: WalletRowProps) => null;
// --- End mocks ---

type Blockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain | string;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  priority: number;
}

interface Props extends BoxProps {}

const PRIORITY_BY_CHAIN: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number =>
  PRIORITY_BY_CHAIN[blockchain] ?? -99;

const WalletPage: React.FC<Props> = (props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances
      .map((balance) => ({
        ...balance,
        priority: getPriority(balance.blockchain),
        formatted: balance.amount.toFixed(),
      }))
      .filter(
        (balance): balance is FormattedWalletBalance =>
          balance.priority > -99 && balance.amount > 0,
      )
      .sort((lhs, rhs) => rhs.priority - lhs.priority);
  }, [balances]);

  const rows = useMemo(
    () =>
      sortedBalances.map((balance) => {
        const price = prices[balance.currency] ?? 0;
        const usdValue = price * balance.amount;

        return (
          <WalletRow
            className={classes.row}
            key={`${balance.blockchain}-${balance.currency}`}
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={balance.formatted}
          />
        );
      }),
    [sortedBalances, prices],
  );

  return (
    <div {...rest}>
      {rows}
      {children}
    </div>
  );
};

export default WalletPage;
