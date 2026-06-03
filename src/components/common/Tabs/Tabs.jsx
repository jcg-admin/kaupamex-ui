// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Tabs/Tabs.jsx
/**
 * Tabs / Tab / TabPanel -- ecommerce-ui
 * Patron ARIA Tabs con API completa de ui-core tab.js.
 * Metodos: show(id) via ref
 * Navegacion: ArrowLeft/Right/Up/Down, Home, End
 * Activacion: automatic | manual
 * Orientacion: horizontal | vertical
 * TabList con forwardRef para ScrollSpy
 */
import {
  createContext, useContext, useState, useId,
  useCallback, useRef, useImperativeHandle, forwardRef,
  Children, isValidElement,
} from 'react';
import styles from './Tabs.module.scss';

const TabsContext = createContext(null);

// Tabs
export const Tabs = forwardRef(function Tabs({
  defaultTab,
  activeTab: controlled,
  onTabChange,
  children,
  className = '',
  orientation = 'horizontal',
  activation  = 'automatic',
  onShow,
  onShown,
  onHide,
  onHidden,
}, ref) {
  const uid = useId();
  const [internalActive, setInternalActive] = useState(defaultTab ?? '');

  const activeTab = controlled !== undefined ? controlled : internalActive;

  const setActiveTab = useCallback((id, prevId) => {
    if (controlled === undefined) setInternalActive(id);
    onHide?.(prevId);
    setTimeout(() => onHidden?.(prevId), 200);
    onShow?.(id);
    setTimeout(() => onShown?.(id), 200);
    onTabChange?.(id);
  }, [controlled, onHide, onHidden, onShow, onShown, onTabChange]);

  const show = useCallback((id) => setActiveTab(id, activeTab), [activeTab, setActiveTab]);

  useImperativeHandle(ref, () => ({ show }), [show]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, uid, orientation, activation }}>
      <div
        className={[
          styles.tabs,
          orientation === 'vertical' ? styles.vertical : '',
          className,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

// TabList con forwardRef para ScrollSpy
export const TabList = forwardRef(function TabList({
  children,
  className = '',
  label = 'Navegacion por pestanas',
}, externalRef) {
  const { uid, setActiveTab, activeTab, orientation, activation } = useContext(TabsContext);
  const listRef = useRef(null);

  const setRef = useCallback((el) => {
    listRef.current = el;
    if (typeof externalRef === 'function') externalRef(el);
    else if (externalRef) externalRef.current = el;
  }, [externalRef]);

  const handleKeyDown = useCallback((e) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll('[role="tab"]:not([disabled])') ?? []
    );
    const idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;

    const isVertical = orientation === 'vertical';
    const prevKey = isVertical ? 'ArrowUp'   : 'ArrowLeft';
    const nextKey = isVertical ? 'ArrowDown'  : 'ArrowRight';

    if (e.key === nextKey) {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      next?.focus();
      if (activation === 'automatic') setActiveTab(next?.dataset.tabId, activeTab);
    } else if (e.key === prevKey) {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      prev?.focus();
      if (activation === 'automatic') setActiveTab(prev?.dataset.tabId, activeTab);
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabs[0]?.focus();
      if (activation === 'automatic') setActiveTab(tabs[0]?.dataset.tabId, activeTab);
    } else if (e.key === 'End') {
      e.preventDefault();
      tabs[tabs.length - 1]?.focus();
      if (activation === 'automatic') setActiveTab(tabs[tabs.length - 1]?.dataset.tabId, activeTab);
    } else if ((e.key === 'Enter' || e.key === ' ') && activation === 'manual') {
      e.preventDefault();
      setActiveTab(document.activeElement?.dataset.tabId, activeTab);
    }
  }, [setActiveTab, activeTab, orientation, activation]);

  return (
    <div
      ref={setRef}
      role="tablist"
      className={`${styles.tabList} ${className}`}
      onKeyDown={handleKeyDown}
      aria-label={label}
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
});

// Tab
export const Tab = forwardRef(function Tab({
  id, children, className = '', disabled = false,
  onShow, onHide,
}, ref) {
  const { activeTab, setActiveTab, uid } = useContext(TabsContext);
  const isActive = activeTab === id;

  const activate = useCallback(() => {
    if (disabled) return;
    onHide?.(activeTab);
    setActiveTab(id, activeTab);
    onShow?.(id);
  }, [disabled, id, activeTab, setActiveTab, onShow, onHide]);

  useImperativeHandle(ref, () => ({
    show: activate,
    isActive: () => isActive,
  }), [activate, isActive]);

  return (
    <button
      role="tab"
      id={`tab-${uid}-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${uid}-${id}`}
      aria-disabled={disabled ? true : undefined}
      data-tab-id={id}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={[
        styles.tab,
        isActive   ? styles.tabActive   : '',
        disabled   ? styles.tabDisabled : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={activate}
    >
      {children}
    </button>
  );
});

// TabPanel
export function TabPanel({ tabId, children, className = '', lazy = true }) {
  const { activeTab, uid } = useContext(TabsContext);
  const isActive = activeTab === tabId;
  const [rendered, setRendered] = useState(isActive);

  if (isActive && !rendered) setRendered(true);

  return (
    <div
      role="tabpanel"
      id={`panel-${uid}-${tabId}`}
      aria-labelledby={`tab-${uid}-${tabId}`}
      hidden={!isActive}
      tabIndex={0}
      className={[styles.tabPanel, isActive ? styles.tabPanelActive : '', className]
        .filter(Boolean).join(' ')}
    >
      {lazy ? (rendered ? children : null) : children}
    </div>
  );
}
