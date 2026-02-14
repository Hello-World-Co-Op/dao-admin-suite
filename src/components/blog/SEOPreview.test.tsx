/**
 * Tests for SEOPreview Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Validates:
 * - Google SERP card preview renders correctly (AC4)
 * - Title truncation at 60 chars (AC4)
 * - Description truncation at 155-160 chars (AC4)
 * - URL structure: www.helloworlddao.com/blog/{slug} (AC4)
 * - Real-time updates as title/excerpt/slug change (AC4)
 * - Yellow warning if title > 60 chars (AC4)
 * - Yellow warning if excerpt < 100 or > 160 chars (AC4)
 * - Social media card with OG image (AC4)
 *
 * @see AC4 - SEOPreview in MetadataPanel
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SEOPreview } from './SEOPreview';

describe('SEOPreview', () => {
  const defaultProps = {
    title: 'My Blog Post',
    slug: 'my-blog-post',
    excerpt: 'This is a short excerpt about the blog post.',
  };

  describe('AC4: Google SERP preview', () => {
    it('renders google preview card', () => {
      render(<SEOPreview {...defaultProps} />);

      expect(screen.getByTestId('google-preview')).toBeInTheDocument();
    });

    it('displays title in blue', () => {
      render(<SEOPreview {...defaultProps} />);

      const seoTitle = screen.getByTestId('seo-title');
      expect(seoTitle).toHaveTextContent('My Blog Post');
      expect(seoTitle).toHaveClass('text-blue-700');
    });

    it('displays URL with slug', () => {
      render(<SEOPreview {...defaultProps} />);

      expect(screen.getByTestId('seo-url')).toHaveTextContent('www.helloworlddao.com/blog/my-blog-post');
    });

    it('displays excerpt', () => {
      render(<SEOPreview {...defaultProps} />);

      expect(screen.getByTestId('seo-excerpt')).toHaveTextContent(defaultProps.excerpt);
    });

    it('shows default URL when no slug', () => {
      render(<SEOPreview {...defaultProps} slug="" />);

      expect(screen.getByTestId('seo-url')).toHaveTextContent('www.helloworlddao.com/blog/your-slug');
    });

    it('shows "Untitled Post" when no title', () => {
      render(<SEOPreview {...defaultProps} title="" />);

      expect(screen.getByTestId('seo-title')).toHaveTextContent('Untitled Post');
    });
  });

  describe('AC4: Title truncation at 60 chars', () => {
    it('does not truncate short title', () => {
      render(<SEOPreview {...defaultProps} title="Short Title" />);

      expect(screen.getByTestId('seo-title')).toHaveTextContent('Short Title');
    });

    it('truncates title longer than 60 chars with ellipsis', () => {
      const longTitle = 'A'.repeat(70);
      render(<SEOPreview {...defaultProps} title={longTitle} />);

      const displayed = screen.getByTestId('seo-title').textContent || '';
      expect(displayed.length).toBeLessThanOrEqual(63); // 60 + "..."
      expect(displayed).toContain('...');
    });
  });

  describe('AC4: Description truncation at 160 chars', () => {
    it('does not truncate short excerpt', () => {
      render(<SEOPreview {...defaultProps} excerpt="Short excerpt" />);

      expect(screen.getByTestId('seo-excerpt')).toHaveTextContent('Short excerpt');
    });

    it('truncates excerpt longer than 160 chars', () => {
      const longExcerpt = 'B'.repeat(200);
      render(<SEOPreview {...defaultProps} excerpt={longExcerpt} />);

      const displayed = screen.getByTestId('seo-excerpt').textContent || '';
      expect(displayed.length).toBeLessThanOrEqual(163); // 160 + "..."
      expect(displayed).toContain('...');
    });
  });

  describe('AC4: Title length warning', () => {
    it('does not show warning for title <= 60 chars', () => {
      render(<SEOPreview {...defaultProps} title={'A'.repeat(60)} />);

      expect(screen.queryByTestId('seo-title-warning')).not.toBeInTheDocument();
    });

    it('shows yellow warning for title > 60 chars', () => {
      render(<SEOPreview {...defaultProps} title={'A'.repeat(65)} />);

      const warning = screen.getByTestId('seo-title-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveClass('text-yellow-600');
      expect(warning).toHaveTextContent('65 chars');
      expect(warning).toHaveTextContent('recommended: 60 max');
    });
  });

  describe('AC4: Excerpt length warnings', () => {
    it('does not show warning for excerpt between 100-160 chars', () => {
      render(<SEOPreview {...defaultProps} excerpt={'C'.repeat(120)} />);

      expect(screen.queryByTestId('seo-excerpt-short-warning')).not.toBeInTheDocument();
      expect(screen.queryByTestId('seo-excerpt-long-warning')).not.toBeInTheDocument();
    });

    it('shows short warning for excerpt < 100 chars (but > 0)', () => {
      render(<SEOPreview {...defaultProps} excerpt={'C'.repeat(50)} />);

      const warning = screen.getByTestId('seo-excerpt-short-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveClass('text-yellow-600');
      expect(warning).toHaveTextContent('50 chars');
    });

    it('does not show short warning for empty excerpt', () => {
      render(<SEOPreview {...defaultProps} excerpt="" />);

      expect(screen.queryByTestId('seo-excerpt-short-warning')).not.toBeInTheDocument();
    });

    it('shows long warning for excerpt > 160 chars', () => {
      render(<SEOPreview {...defaultProps} excerpt={'D'.repeat(170)} />);

      const warning = screen.getByTestId('seo-excerpt-long-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveClass('text-yellow-600');
      expect(warning).toHaveTextContent('170 chars');
    });
  });

  describe('AC4: Social media card preview', () => {
    it('renders social preview card', () => {
      render(<SEOPreview {...defaultProps} />);

      expect(screen.getByTestId('social-preview')).toBeInTheDocument();
    });

    it('shows placeholder when no OG image', () => {
      render(<SEOPreview {...defaultProps} />);

      expect(screen.getByTestId('og-image-placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('og-image-placeholder')).toHaveTextContent('No OG image set');
    });

    it('shows OG image when URL provided', () => {
      render(<SEOPreview {...defaultProps} ogImageUrl="https://example.com/og.jpg" />);

      const img = screen.getByTestId('og-image-social');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/og.jpg');
    });

    it('shows placeholder when ogImageUrl is null', () => {
      render(<SEOPreview {...defaultProps} ogImageUrl={null} />);

      expect(screen.getByTestId('og-image-placeholder')).toBeInTheDocument();
    });
  });
});
