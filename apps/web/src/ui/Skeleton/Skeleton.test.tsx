import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonParagraph,
  SkeletonProgress,
  SkeletonTask,
} from './Skeleton.js';

describe('Skeleton', () => {
  it('renders a base skeleton as a status region', () => {
    render(<Skeleton width={100} height={16} aria-label="Загрузка XP" />);
    expect(screen.getByRole('status', { name: 'Загрузка XP' })).toBeInTheDocument();
  });

  it('renders the text/avatar/card presets', () => {
    render(
      <>
        <SkeletonAvatar />
        <SkeletonCard />
      </>,
    );
    expect(screen.getByRole('status', { name: 'Загрузка аватара' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Загрузка карточки' })).toBeInTheDocument();
  });

  it('renders a paragraph as a single status region', () => {
    render(<SkeletonParagraph lines={3} />);
    expect(screen.getAllByRole('status', { name: 'Загрузка текста' })).toHaveLength(1);
  });

  it('renders list/task/progress composites', () => {
    render(
      <>
        <SkeletonList rows={2} />
        <SkeletonTask />
        <SkeletonProgress />
      </>,
    );
    expect(screen.getByRole('status', { name: 'Загрузка списка' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Загрузка задания' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Загрузка прогресса' })).toBeInTheDocument();
  });
});
