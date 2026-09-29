import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskNumberStrip, type TaskNumberStripEntry } from './TaskNumberStrip.js';

function makeRange(count: number): TaskNumberStripEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    taskId: `task-${i + 1}`,
    taskNumber: i + 1,
  }));
}

describe('TaskNumberStrip — active number stays in view (audit Block 4)', () => {
  it('scrolls the active number into view on first render, even deep in the range (e.g. #15 of 19)', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<TaskNumberStrip active={15} range={makeRange(19)} onSelect={() => {}} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'center' });
  });

  it('re-scrolls when the active number changes (Prev/Next/Skip/number click)', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { rerender } = render(
      <TaskNumberStrip active={1} range={makeRange(19)} onSelect={() => {}} />,
    );
    const callsAfterMount = scrollIntoView.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);

    rerender(<TaskNumberStrip active={19} range={makeRange(19)} onSelect={() => {}} />);
    expect(scrollIntoView.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('does not re-trigger the scroll on an unrelated re-render, so a manual scroll away is not fought back', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const range = makeRange(19);
    const { rerender } = render(<TaskNumberStrip active={5} range={range} onSelect={() => {}} />);
    const callsAfterMount = scrollIntoView.mock.calls.length;

    // Same active number, a new (but equal-length) range array — the
    // kind of re-render that happens constantly from parent state
    // changes unrelated to task navigation.
    rerender(<TaskNumberStrip active={5} range={[...range]} onSelect={() => {}} />);
    expect(scrollIntoView.mock.calls.length).toBe(callsAfterMount);
  });

  it('still highlights and selects numbers via manual arrow/tap navigation', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TaskNumberStrip active={5} range={makeRange(19)} onSelect={onSelect} />);
    expect(screen.getByText('5')).toHaveAttribute('aria-current', 'true');
    await user.click(screen.getByText('8'));
    expect(onSelect).toHaveBeenCalledWith({ taskId: 'task-8', taskNumber: 8 });
  });
});
