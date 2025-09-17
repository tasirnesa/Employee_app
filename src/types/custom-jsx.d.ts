declare namespace JSX {
  interface IntrinsicElements {
    'chartjs': {
      children: { [key: string]: any }; // Allows the JSON config object as children
    };
  }
}