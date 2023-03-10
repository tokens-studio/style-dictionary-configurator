import { OverlayController } from "@lion/ui/overlays.js";
import { renderLitAsNode } from "@lion/ui/helpers.js";
import { html } from "lit";
import "./ts-snackbar.js";

class SnackbarManager {
  constructor() {
    this.queue = [];
    this.showing = false;
  }

  async init() {
    const snackbarEl = renderLitAsNode(
      html`<ts-snackbar role="status"></ts-snackbar>`
    );
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

  show(msg = "", dur = 5000) {
    const prom = () => this.msgPromise(msg, dur);
    this.queue.push(prom);
    this.runQueue();
  }

  async showAnimation(msg) {
    const snackbar = this.controller.contentNode;
    snackbar.message = msg;
    snackbar.setAttribute("shown", "");
    snackbar.removeAttribute("aria-hidden");
    await new Promise((resolve) => {
      const showSnackbarCallback = () => {
        snackbar.removeEventListener("transitionend", showSnackbarCallback);
        resolve();
      };
      snackbar.addEventListener("transitionend", showSnackbarCallback);
    });
  }

  async msgPromise(msg, dur) {
    if (!this.controller) {
      await this.init();
    }
    await this.showAnimation(msg);
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
    const snackbar = this.controller.contentNode;
    snackbar.removeAttribute("shown");
    snackbar.setAttribute("aria-hidden", "true");
    await new Promise((resolve) => {
      const hideSnackbarCallback = () => {
        snackbar.removeEventListener("transitionend", hideSnackbarCallback);
        resolve();
      };
      snackbar.addEventListener("transitionend", hideSnackbarCallback);
    });
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
