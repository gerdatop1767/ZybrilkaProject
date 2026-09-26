import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectDesktop } from './SubjectDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderSubject() {
  return render(
    <NavigationProvider>
      <SubjectDesktop subjectId="math" from="subjectCatalog" />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('SubjectDesktop — Задания по номерам source filter', () => {
  it('shows a ФИПИ source selector and switching source changes the grid counts', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    expect(screen.getByText('Выбери номер задания ЕГЭ')).toBeInTheDocument();
    expect(screen.getByText('ФИПИ')).toBeInTheDocument();

    const before = screen.getByText('№1').closest('button')!.textContent;

    await user.click(screen.getByRole('button', { name: 'ФИПИ' }));
    await user.click(screen.getByRole('option', { name: 'Открытый банк' }));

    expect(screen.getByText('Открытый банк')).toBeInTheDocument();
    const after = screen.getByText('№1').closest('button')!.textContent;
    expect(after).not.toBe(before);
  });

  it("shows the source in a task number's detail view", async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    await user.click(screen.getByText('№3'));
    expect(screen.getByText(/источник: ФИПИ/)).toBeInTheDocument();
  });

  it('back from a number detail returns to the grid, not Предметы', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    await user.click(screen.getByText('№3'));
    const backRow = screen.getAllByRole('button', { name: /Задания по номерам/ })[0]!;
    await user.click(backRow);
    expect(screen.getByText('Выбери номер задания ЕГЭ')).toBeInTheDocument();
  });
});

describe('SubjectDesktop — Случайные задания source filter', () => {
  it('shows a source selector for random tasks', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Случайные задания'));
    expect(screen.getByText('ФИПИ')).toBeInTheDocument();
  });
});

describe('SubjectDesktop — Варианты (variant builder)', () => {
  it('lets picking a source and individual task numbers, updating the summary', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    expect(
      screen.getByText('Собери собственный вариант из нужных заданий и источников'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Выбрано 2 заданий')).toBeInTheDocument();
    expect(screen.getByText(/Номера: 1, 2/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Открытый банк/ }));
    expect(screen.getByText(/Источник: Открытый банк/)).toBeInTheDocument();
  });

  it('"Выбрать всё" selects every task number', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    await user.click(screen.getByRole('button', { name: /Выбрать всё/ }));
    expect(screen.getByText('Выбрано 19 заданий')).toBeInTheDocument();
  });

  it('reset clears the selection', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: /Сбросить/ }));
    expect(screen.getByText('Выбрано 0 заданий')).toBeInTheDocument();
    expect(screen.getByText(/Номера не выбраны/)).toBeInTheDocument();
  });

  it('disables the primary CTA until at least one number is selected', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    expect(screen.getByRole('button', { name: /Собрать вариант/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByRole('button', { name: /Собрать вариант/ })).toBeEnabled();
  });
});

describe('SubjectDesktop — BackRow', () => {
  it('returns to the parent screen it opened from (subjectCatalog), not the tab underneath', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'К предметам' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('subjectCatalog');
  });
});
