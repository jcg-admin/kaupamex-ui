/**
 * Barrel export — componentes comunes (ui-core-5.25.0)
 * Importa desde aquí: import { Modal, Tooltip, Alert, ... } from '@components/common'
 *
 * Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
 * Origen: template-ecommerce-ui/src/components/common/index.js
 */

// ── Overlays ──────────────────────────────────────────────────────────────────
export { default as Modal }      from './Modal/Modal';
export { default as Offcanvas }  from './Offcanvas/Offcanvas';
export { default as Popover }    from './Popover/Popover';
export { default as Tooltip }    from './Tooltip/Tooltip';
export { default as SearchModal } from './SearchModal/SearchModal';

// ── Notificaciones ─────────────────────────────────────────────────────────────
export { default as Alert }      from './Alert/Alert';
export { default as Toast }      from './Toast/ToastContainer';

// ── Navegación ─────────────────────────────────────────────────────────────────
export { Tabs, Tab, TabList, TabPanel } from './Tabs/Tabs';
export { default as Dropdown }   from './Dropdown/Dropdown';
export { DropdownItem, DropdownDivider, DropdownHeader } from './Dropdown/Dropdown';
export { default as Stepper }    from './Stepper/Stepper';
export { StepPanel }             from './Stepper/Stepper';
export { default as Collapse }   from './Collapse/Collapse';
export { default as ScrollSpy }  from './ScrollSpy/ScrollSpy';
export { useScrollSpy }          from './ScrollSpy/ScrollSpy';

// ── Contenido ──────────────────────────────────────────────────────────────────
export { default as Carousel }   from './Carousel/Carousel';
export { CarouselSlide }         from './Carousel/Carousel';

// ── Formularios ────────────────────────────────────────────────────────────────
export { default as Autocomplete }  from './Autocomplete/Autocomplete';
export { default as MultiSelect }   from './MultiSelect/MultiSelect';
export { default as RangeSlider }   from './RangeSlider/RangeSlider';
export { default as LoadingButton } from './LoadingButton/LoadingButton';
export { default as Chip }          from './Chip/Chip';
export { default as ChipInput }     from './Chip/ChipInput';

// ── Datos ──────────────────────────────────────────────────────────────────────
export { default as DataTable }     from './DataTable/DataTable';

// ── Fecha y hora ────────────────────────────────────────────────────────────────
export { default as Calendar }        from './DatePicker/Calendar';
export { default as DatePicker }      from './DatePicker/DatePicker';
export { default as DateRangePicker } from './DatePicker/DateRangePicker';
export { default as TimePicker }      from './TimePicker/TimePicker';

// ── Primitivos ─────────────────────────────────────────────────────────────────
export {
  Button, Field, Price, MetaTag,
} from './primitives/index.jsx';
