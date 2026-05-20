/**
 * Secure Storage
 * Almacenamiento encriptado para datos sensibles en localStorage
 * Usar SOLO para datos no criticos (logs, preferencias)
 *
 * IMPORTANTE: Tokens NO deben ir aqui
 *   - Tokens JWT (access + refresh) viven en memory del modulo
 *     apiService — ver DEC-AUTH-2 de fix-ui-auth-logout-y-
 *     refresh-wiring. localStorage (encriptado o no) es XSS-
 *     vulnerable porque la clave de encriptacion vive en el
 *     bundle JS leible.
 *   - Datos de usuario van en Redux state.
 */

import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor(secretKey) {
    this.secretKey = secretKey;
    this.prefix = 'sec_'; // Prefijo para keys encriptadas
  }

  /**
   * Encriptar valor
   */
  _encrypt(value) {
    try {
      const stringValue = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(
        stringValue,
        this.secretKey
      ).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Desencriptar valor
   */
  _decrypt(encryptedValue) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedValue,
        this.secretKey
      ).toString(CryptoJS.enc.Utf8);

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Guardar valor encriptado
   */
  setItem(key, value) {
    try {
      const encryptedValue = this._encrypt(value);
      if (encryptedValue) {
        localStorage.setItem(this.prefix + key, encryptedValue);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set secure item:', error);
      return false;
    }
  }

  /**
   * Obtener valor desencriptado
   */
  getItem(key) {
    try {
      const encryptedValue = localStorage.getItem(this.prefix + key);
      if (!encryptedValue) return null;

      return this._decrypt(encryptedValue);
    } catch (error) {
      console.error('Failed to get secure item:', error);
      return null;
    }
  }

  /**
   * Remover valor
   */
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Failed to remove secure item:', error);
      return false;
    }
  }

  /**
   * Limpiar todos los datos
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      return false;
    }
  }

  /**
   * Obtener todas las keys
   */
  keys() {
    const keys = [];
    try {
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      });
    } catch (error) {
      console.error('Failed to get keys:', error);
    }
    return keys;
  }

  /**
   * Obtener cantidad de items
   */
  length() {
    return this.keys().length;
  }
}

/**
 * Crear instancia con secret key
 * IMPORTANTE: En production, esto debe venir del backend
 */
const getSecretKey = () => {
  // En development, usar key estatica
  if (process.env.NODE_ENV === 'development') {
    return process.env.PY_STORAGE_SECRET || 'dev-secret-key-change-in-production';
  }

  // En production, obtener del backend o environment
  return process.env.PY_STORAGE_SECRET || '';
};

const secureStorage = new SecureStorage(getSecretKey());

export { SecureStorage, secureStorage };
