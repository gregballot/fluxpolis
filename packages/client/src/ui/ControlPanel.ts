export class ControlPanel {
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <h1>Fluxpolis</h1>
      <p>Hello from UI Layer</p>
    `;
  }
}
