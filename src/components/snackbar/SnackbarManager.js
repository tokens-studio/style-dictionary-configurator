import { OverlayController } from "@lion/ui/overlays.js";
import { renderLitAsNode } from "@lion/ui/helpers.js";
import { html } from "lit";
import "./ts-snackbar.js";

class SnackbarManager {
  constructor() {
    this.queue = [];
    this.showing = false;
  }

  get snackbarEl() {
    return this.controller.contentNode;
  }

  async init() {
    const snackbarEl = renderLitAsNode(
      html`<ts-snackbar role="status"></ts-snackbar>`
    );
    snackbarEl.manager = this;
    document.body.appendChild(snackbarEl);
    this.controller = new OverlayController({
      placementMode: "global",
      contentNode: snackbarEl,
    });

    // FIXME: workaround until release of https://github.com/ing-bank/lion/pull/1936
    this.controller.__wrappingDialogNode.style.padding = 0;

    await this.controller.show();
    await this.wait();
  }

  show(msg = "", { dur = 5000, status = "error" } = {}) {
    const prom = () => this.msgPromise(msg, { dur, status });
    this.queue.push(prom);
    this.runQueue();
  }

  async showAnimation(msg, status) {
    this.snackbarEl.message = msg;
    this.snackbarEl.status = status;
    this.snackbarEl.setAttribute("shown", "");
    this.snackbarEl.removeAttribute("aria-hidden");
    await new Promise((resolve) => {
      const showSnackbarCallback = () => {
        this.snackbarEl.removeEventListener(
          "transitionend",
          showSnackbarCallback
        );
        resolve();
      };
      this.snackbarEl.addEventListener("transitionend", showSnackbarCallback);
    });
  }

  async msgPromise(msg, { dur, status }) {
    if (!this.controller) {
      await this.init();
    }
    await this.showAnimation(msg, status);
    await this.wait(dur);
    await this.hideAnimation();
  }

  async runQueue() {
    if (!this.showing) {
      this.showing = true;
      while (this.queue.length > 0) {
        await this.queue[0]();
        this.queue.shift();
      }
    }
    this.showing = false;
  }

  hide() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
      if (this.timeoutResolver) {
        this.timeoutResolver();
      }
    }
    this.showing = false;
  }

  async hideAnimation() {
    this.snackbarEl.removeAttribute("shown");
    this.snackbarEl.setAttribute("aria-hidden", "true");
    await new Promise((resolve) => {
      const hideSnackbarCallback = () => {
        this.snackbarEl.removeEventListener(
          "transitionend",
          hideSnackbarCallback
        );
        resolve();
      };
      this.snackbarEl.addEventListener("transitionend", hideSnackbarCallback);
    });
  }

  async closeCurrent() {
    this.timeoutResolver();
  }

  async wait(dur) {
    await new Promise((resolve) => {
      this.timeoutResolver = resolve;
      this.timeout = setTimeout(() => {
        this.timeout = null;
        if (this.timeoutResolver) {
          this.timeoutResolver();
        }
      }, dur);
    });
  }

  teardown() {
    this.queue = [];
    this.hide();
    if (this.controller) {
      this.controller.teardown();
      this.controller = null;
    }
  }
}

export const snackbar = new SnackbarManager();
