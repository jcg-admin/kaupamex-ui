// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Tabs/Tabs.test.jsx
/**
 * Tests: Tabs — API completa de ui-core tab.js
 * Métodos: show() via ref
 * Navegación: ArrowLeft/Right, Home, End
 * Activación: automatic | manual
 * Eventos: onShow, onShown, onHide, onHidden
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { Tabs, Tab, TabList, TabPanel } from './Tabs';

const Suite = ({ tabsRef, tabRef, ...props }) => (
  <Tabs defaultTab="a" ref={tabsRef} {...props}>
    <TabList>
      <Tab id="a" ref={tabRef}>Tab A</Tab>
      <Tab id="b">Tab B</Tab>
      <Tab id="c">Tab C</Tab>
    </TabList>
    <TabPanel tabId="a"><p>Panel A</p></TabPanel>
    <TabPanel tabId="b"><p>Panel B</p></TabPanel>
    <TabPanel tabId="c"><p>Panel C</p></TabPanel>
  </Tabs>
);

describe('Tabs — API completa ui-core', () => {
  it('muestra el panel del tab activo por defecto', () => {
    render(<Suite />);
    expect(screen.getByText('Panel A')).toBeInTheDocument();
    expect(screen.queryByText('Panel B')).not.toBeInTheDocument();
  });

  it('click en Tab B activa su panel (show())', () => {
    render(<Suite />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel B')).toBeInTheDocument();
  });

  it('el tab activo tiene aria-selected=true', () => {
    render(<Suite />);
    expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'false');
  });

  it('ArrowRight navega al siguiente tab (activation=automatic)', () => {
    render(<Suite />);
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    tabA.focus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft navega al tab anterior', () => {
    render(<Suite />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
    screen.getByRole('tab', { name: 'Tab B' }).focus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Home va al primer tab', () => {
    render(<Suite />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tab C' }));
    screen.getByRole('tab', { name: 'Tab C' }).focus();
    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('aria-selected', 'true');
  });

  it('End va al último tab', () => {
    render(<Suite />);
    screen.getByRole('tab', { name: 'Tab A' }).focus();
    fireEvent.keyDown(document.activeElement, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Tab C' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Tabs ref.show(id) activa una pestaña programáticamente', () => {
    const ref = createRef();
    render(<Suite tabsRef={ref} />);
    act(() => ref.current.show('b'));
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'true');
  });

  it('onShow se llama al activar un tab', () => {
    const onShow = jest.fn();
    render(<Suite onShow={onShow} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
    expect(onShow).toHaveBeenCalledWith('b');
  });

  it('Tab disabled no se puede activar', () => {
    render(
      <Tabs defaultTab="a">
        <TabList>
          <Tab id="a">A</Tab>
          <Tab id="b" disabled>B Disabled</Tab>
        </TabList>
        <TabPanel tabId="a"><p>PA</p></TabPanel>
        <TabPanel tabId="b"><p>PB</p></TabPanel>
      </Tabs>
    );
    fireEvent.click(screen.getByRole('tab', { name: 'B Disabled' }));
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
  });
});
