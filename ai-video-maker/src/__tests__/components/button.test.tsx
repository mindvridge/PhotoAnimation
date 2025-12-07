/**
 * Button Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button Component', () => {
  describe('렌더링', () => {
    it('기본 버튼이 렌더링되어야 함', () => {
      render(<Button>클릭</Button>);

      expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument();
    });

    it('children이 올바르게 렌더링되어야 함', () => {
      render(<Button>테스트 버튼</Button>);

      expect(screen.getByText('테스트 버튼')).toBeInTheDocument();
    });

    it('data-slot 속성이 설정되어야 함', () => {
      render(<Button>버튼</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('variants', () => {
    it('default variant가 적용되어야 함', () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('destructive variant가 적용되어야 함', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('outline variant가 적용되어야 함', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('secondary variant가 적용되어야 함', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('ghost variant가 적용되어야 함', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('link variant가 적용되어야 함', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
    });
  });

  describe('sizes', () => {
    it('default size가 적용되어야 함', () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('sm size가 적용되어야 함', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('lg size가 적용되어야 함', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('icon size가 적용되어야 함', () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });
  });

  describe('상호작용', () => {
    it('클릭 이벤트가 동작해야 함', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>클릭</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 클릭이 무시되어야 함', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('disabled 상태에서 opacity가 적용되어야 함', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('커스텀 className', () => {
    it('추가 className이 적용되어야 함', () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('기본 클래스와 커스텀 클래스가 함께 적용되어야 함', () => {
      render(<Button className="my-button" variant="outline">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-button');
      expect(button).toHaveClass('border');
    });
  });

  describe('asChild prop', () => {
    it('asChild=false일 때 button 요소로 렌더링', () => {
      render(<Button asChild={false}>Button</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('buttonVariants', () => {
    it('buttonVariants 함수가 올바른 클래스를 반환해야 함', () => {
      const classes = buttonVariants({ variant: 'default', size: 'default' });

      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-9');
    });

    it('variant와 size 조합이 올바르게 동작해야 함', () => {
      const classes = buttonVariants({ variant: 'destructive', size: 'lg' });

      expect(classes).toContain('bg-destructive');
      expect(classes).toContain('h-10');
    });
  });

  describe('접근성', () => {
    it('type 속성을 전달할 수 있어야 함', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('aria-label을 전달할 수 있어야 함', () => {
      render(<Button aria-label="액션 버튼">Action</Button>);

      const button = screen.getByRole('button', { name: '액션 버튼' });
      expect(button).toBeInTheDocument();
    });
  });
});
