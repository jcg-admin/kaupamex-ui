/**
 * useForm -- PracticaYoruba
 * Manejo de formularios con validacion.
 * Usado en: LoginPage, RegisterPage, CheckoutPage (address step),
 *           ProfilePage.
 */

import { useState, useCallback } from 'react';

/**
 * @param {Object} initialValues  -- valores iniciales del formulario
 * @param {Function} validate     -- funcion de validacion, retorna { field: msg }
 */
export function useForm(initialValues = {}, validate = () => ({})) {
  const [values,   setValues]   = useState(initialValues);
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpiar error al escribir
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldErrors = validate({ ...values });
    if (fieldErrors[name]) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [values, validate]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const allErrors = validate(values);
    setErrors(allErrors);
    setTouched(Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    if (Object.keys(allErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const isValid = Object.keys(validate(values)).length === 0;

  return {
    values, errors, touched, isSubmitting, isValid,
    handleChange, handleBlur, handleSubmit, reset, setValue,
  };
}

export default useForm;
