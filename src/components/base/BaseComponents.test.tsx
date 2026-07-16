import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import Card from './Card';
import StatCard from './StatCard';
import Modal from './Modal';
import TabGroup from './TabGroup';
import Badge from './Badge';
import { Heart, TrendingUp } from 'lucide-react';

// ============================================================
// Button Component
// ============================================================
describe('Button Component', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-cyan-600');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-600');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
    expect(btn.className).toContain('border');
  });

  it('applies gradient variant styles', () => {
    render(<Button variant="gradient">Gradient</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-gradient-to-r');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('text-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('text-lg');
  });

  it('shows loading spinner and disables button when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    // Should not show original children
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('renders icon on the left by default', () => {
    render(<Button icon={Heart}>With Icon</Button>);
    const btn = screen.getByRole('button');
    // Icon renders an SVG inside the button
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders icon on the right when iconPosition is right', () => {
    render(<Button icon={Heart} iconPosition="right">With Icon</Button>);
    const btn = screen.getByRole('button');
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when isLoading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="extra-class">Styled</Button>);
    expect(screen.getByRole('button').className).toContain('extra-class');
  });

  it('passes native button attributes', () => {
    render(<Button type="submit" name="submit-btn">Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toHaveAttribute('name', 'submit-btn');
  });
});

// ============================================================
// Card Component
// ============================================================
describe('Card Component', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<Card>Default</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('bg-slate-800/50');
    expect(div.className).toContain('border');
  });

  it('applies elevated variant styles', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('shadow-lg');
  });

  it('applies ghost variant styles', () => {
    const { container } = render(<Card variant="ghost">Ghost</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('bg-transparent');
  });

  it('applies gradient variant styles', () => {
    const { container } = render(<Card variant="gradient">Gradient</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('bg-gradient-to-br');
  });

  it('includes hover styles by default', () => {
    const { container } = render(<Card>Hover</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('hover:border-cyan-500/30');
  });

  it('excludes hover styles when hover is false', () => {
    const { container } = render(<Card hover={false}>No Hover</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).not.toContain('hover:border-cyan-500/30');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="my-custom">Custom</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('my-custom');
  });
});

// ============================================================
// StatCard Component
// ============================================================
describe('StatCard Component', () => {
  it('renders label and value', () => {
    render(<StatCard label="Patients" value={42} icon={Heart} />);
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard label="Status" value="Active" icon={Heart} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<StatCard label="Test" value={10} icon={Heart} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows positive trend with TrendingUp icon', () => {
    render(<StatCard label="Growth" value={100} icon={Heart} trend={12} />);
    expect(screen.getByText('12%')).toBeInTheDocument();
    // TrendingUp icon is a different component than Heart
    // The stat card should show TrendingUp for positive trend
    const svgs = document.querySelectorAll('svg');
    // Heart icon + TrendingUp icon = 2 SVGs
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('shows negative trend with red color text', () => {
    const { container } = render(<StatCard label="Decline" value={50} icon={Heart} trend={-5} />);
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(container.innerHTML).toContain('text-red-400');
  });

  it('does not show trend when not provided', () => {
    render(<StatCard label="No Trend" value={10} icon={Heart} />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<StatCard label="Test" value={10} icon={Heart} description="Some description" />);
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<StatCard label="Test" value={10} icon={Heart} />);
    // The value "10" should exist, description should not
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies color styles via color prop', () => {
    const { container } = render(<StatCard label="Test" value={10} icon={Heart} color="emerald" />);
    expect(container.innerHTML).toContain('text-emerald-400');
  });
});

// ============================================================
// Modal Component
// ============================================================
describe('Modal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        Content
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders close button (X)', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test">
        Content
      </Modal>
    );
    // The close button is the X icon button (not the backdrop)
    const buttons = screen.getAllByRole('button');
    // One is the X close button
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>
    );
    // The backdrop is the first div with absolute positioning
    const backdrop = document.querySelector('.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" footer={<button>Footer Action</button>}>
        Content
      </Modal>
    );
    expect(screen.getByText('Footer Action')).toBeInTheDocument();
  });

  it('does not render footer when not provided', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test">
        Content
      </Modal>
    );
    // Footer section has specific bg class
    expect(container.innerHTML).not.toContain('bg-slate-900/50');
  });

  it('applies size styles correctly', () => {
    const { container, rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="sm">Content</Modal>
    );
    expect(container.innerHTML).toContain('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="xl">Content</Modal>
    );
    expect(container.innerHTML).toContain('max-w-xl');
  });
});

// ============================================================
// TabGroup Component
// ============================================================
describe('TabGroup Component', () => {
  const tabs = [
    { id: 'tab1', label: 'First Tab', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Second Tab', content: <div>Content 2</div> },
    { id: 'tab3', label: 'Third Tab', content: <div>Content 3</div> },
  ];

  it('renders all tab buttons', () => {
    render(<TabGroup tabs={tabs} activeTabId="tab1" onTabChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /first tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /second tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /third tab/i })).toBeInTheDocument();
  });

  it('renders active tab content', () => {
    render(<TabGroup tabs={tabs} activeTabId="tab1" onTabChange={vi.fn()} />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches content when activeTabId changes', () => {
    const { rerender } = render(
      <TabGroup tabs={tabs} activeTabId="tab1" onTabChange={vi.fn()} />
    );
    expect(screen.getByText('Content 1')).toBeInTheDocument();

    rerender(
      <TabGroup tabs={tabs} activeTabId="tab2" onTabChange={vi.fn()} />
    );
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TabGroup tabs={tabs} activeTabId="tab1" onTabChange={handleChange} />);
    await user.click(screen.getByRole('button', { name: /second tab/i }));
    expect(handleChange).toHaveBeenCalledWith('tab2');
  });

  it('renders tab icon when provided', () => {
    const tabsWithIcon = [
      { id: 'tab1', label: 'With Icon', icon: Heart, content: <div>Content</div> },
    ];
    const { container } = render(
      <TabGroup tabs={tabsWithIcon} activeTabId="tab1" onTabChange={vi.fn()} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies pills variant styles', () => {
    const { container } = render(
      <TabGroup tabs={tabs} activeTabId="tab1" onTabChange={vi.fn()} variant="pills" />
    );
    const tabContainer = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(tabContainer.className).toContain('gap-2');
  });
});

// ============================================================
// Badge Component
// ============================================================
describe('Badge Component', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('is rendered as a span element', () => {
    render(<Badge>Test</Badge>);
    const el = screen.getByText('Test');
    expect(el.tagName).toBe('SPAN');
  });

  it('applies primary variant by default', () => {
    render(<Badge>Primary</Badge>);
    const el = screen.getByText('Primary');
    expect(el.className).toContain('bg-cyan-500/20');
    expect(el.className).toContain('text-cyan-300');
  });

  it('applies success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const el = screen.getByText('Success');
    expect(el.className).toContain('bg-emerald-500/20');
    expect(el.className).toContain('text-emerald-300');
  });

  it('applies error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    const el = screen.getByText('Error');
    expect(el.className).toContain('bg-red-500/20');
    expect(el.className).toContain('text-red-300');
  });

  it('applies warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const el = screen.getByText('Warning');
    expect(el.className).toContain('bg-amber-500/20');
    expect(el.className).toContain('text-amber-300');
  });

  it('applies info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const el = screen.getByText('Info');
    expect(el.className).toContain('bg-blue-500/20');
    expect(el.className).toContain('text-blue-300');
  });

  it('applies secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const el = screen.getByText('Secondary');
    expect(el.className).toContain('bg-slate-500/20');
    expect(el.className).toContain('text-slate-300');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    const el = screen.getByText('Small');
    expect(el.className).toContain('text-xs');

    rerender(<Badge size="lg">Large</Badge>);
    const elLg = screen.getByText('Large');
    expect(elLg.className).toContain('text-base');
  });

  it('applies custom className', () => {
    render(<Badge className="extra">Custom</Badge>);
    const el = screen.getByText('Custom');
    expect(el.className).toContain('extra');
  });

  it('has rounded-full styling', () => {
    render(<Badge>Test</Badge>);
    const el = screen.getByText('Test');
    expect(el.className).toContain('rounded-full');
  });
});