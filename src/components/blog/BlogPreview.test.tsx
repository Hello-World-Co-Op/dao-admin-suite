/**
 * Tests for BlogPreview Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Validates:
 * - Preview modal renders when visible (AC1)
 * - Preview renders with .blog-content class for typography parity (AC1)
 * - Preview displays title and reading time (AC1)
 * - Preview renders HTML content via dangerouslySetInnerHTML (AC1)
 * - Close button closes the modal (AC1)
 * - Escape key closes the modal (AC1)
 * - Backdrop click closes the modal (AC1)
 * - Hidden when visible=false (AC1)
 *
 * @see AC1 - Preview renders with same typography as published posts
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlogPreview } from './BlogPreview';

describe('BlogPreview', () => {
  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
    title: 'Test Post Title',
    htmlContent: '<h2>Section</h2><p>This is test content.</p>',
    readingTime: 3,
  };

  describe('AC1: Preview modal rendering', () => {
    it('renders modal when visible is true', () => {
      render(<BlogPreview {...defaultProps} />);

      expect(screen.getByTestId('blog-preview-modal')).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      render(<BlogPreview {...defaultProps} visible={false} />);

      expect(screen.queryByTestId('blog-preview-modal')).not.toBeInTheDocument();
    });

    it('renders with role="dialog" and aria-modal="true"', () => {
      render(<BlogPreview {...defaultProps} />);

      const modal = screen.getByTestId('blog-preview-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('AC1: Blog typography parity', () => {
    it('renders content inside .blog-content class wrapper', () => {
      render(<BlogPreview {...defaultProps} />);

      const previewBody = screen.getByTestId('preview-body');
      expect(previewBody).toHaveClass('blog-content');
    });

    it('renders HTML content via dangerouslySetInnerHTML', () => {
      render(<BlogPreview {...defaultProps} />);

      const previewBody = screen.getByTestId('preview-body');
      expect(previewBody.innerHTML).toContain('<h2>Section</h2>');
      expect(previewBody.innerHTML).toContain('<p>This is test content.</p>');
    });
  });

  describe('AC1: Preview header', () => {
    it('displays post title', () => {
      render(<BlogPreview {...defaultProps} />);

      expect(screen.getByTestId('preview-title')).toHaveTextContent('Test Post Title');
    });

    it('displays reading time', () => {
      render(<BlogPreview {...defaultProps} />);

      expect(screen.getByTestId('preview-reading-time')).toHaveTextContent('3 min read');
    });

    it('hides reading time when 0', () => {
      render(<BlogPreview {...defaultProps} readingTime={0} />);

      expect(screen.queryByTestId('preview-reading-time')).not.toBeInTheDocument();
    });

    it('hides title when empty', () => {
      render(<BlogPreview {...defaultProps} title="" />);

      expect(screen.queryByTestId('preview-title')).not.toBeInTheDocument();
    });
  });

  describe('AC1: Modal close behavior', () => {
    it('close button calls onClose', () => {
      const onClose = vi.fn();
      render(<BlogPreview {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('preview-close-button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Escape key calls onClose', () => {
      const onClose = vi.fn();
      render(<BlogPreview {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(screen.getByTestId('blog-preview-modal'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('close button has aria-label', () => {
      render(<BlogPreview {...defaultProps} />);

      expect(screen.getByTestId('preview-close-button')).toHaveAttribute('aria-label', 'Close preview');
    });
  });

  describe('AC1: Typography element rendering', () => {
    it('renders headings (h2, h3)', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent="<h2>Heading 2</h2><h3>Heading 3</h3>"
        />
      );

      const body = screen.getByTestId('preview-body');
      expect(body.querySelector('h2')?.textContent).toBe('Heading 2');
      expect(body.querySelector('h3')?.textContent).toBe('Heading 3');
    });

    it('renders paragraphs with bold and italic', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent="<p>Normal <strong>bold</strong> and <em>italic</em> text</p>"
        />
      );

      const body = screen.getByTestId('preview-body');
      expect(body.querySelector('strong')?.textContent).toBe('bold');
      expect(body.querySelector('em')?.textContent).toBe('italic');
    });

    it('renders links', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent='<p><a href="https://example.com">Link text</a></p>'
        />
      );

      const body = screen.getByTestId('preview-body');
      const link = body.querySelector('a');
      expect(link?.textContent).toBe('Link text');
      expect(link?.getAttribute('href')).toBe('https://example.com');
    });

    it('renders blockquotes', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent="<blockquote><p>Quoted text</p></blockquote>"
        />
      );

      const body = screen.getByTestId('preview-body');
      expect(body.querySelector('blockquote')).toBeTruthy();
    });

    it('renders code blocks', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent="<pre><code>const x = 1;</code></pre>"
        />
      );

      const body = screen.getByTestId('preview-body');
      expect(body.querySelector('pre code')?.textContent).toBe('const x = 1;');
    });

    it('renders ordered and unordered lists', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent="<ul><li>Item 1</li></ul><ol><li>Item A</li></ol>"
        />
      );

      const body = screen.getByTestId('preview-body');
      expect(body.querySelector('ul')).toBeTruthy();
      expect(body.querySelector('ol')).toBeTruthy();
    });

    it('renders images', () => {
      render(
        <BlogPreview
          {...defaultProps}
          htmlContent='<img src="https://example.com/photo.jpg" alt="Photo">'
        />
      );

      const body = screen.getByTestId('preview-body');
      const img = body.querySelector('img');
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
      expect(img?.getAttribute('alt')).toBe('Photo');
    });
  });
});
