/// <reference types="expo/types" />

declare module '*.png' {
  const value: import('react-native').ImageSource
  export default value
}
