import { Extension } from '@tiptap/core'

import { PopupMenuPlugin, PopupMenuPluginProps } from './popup-menu-plugin'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    popupMenu: {
      showPopupMenu: () => ReturnType,
      hidePopupMenu: () => ReturnType,
    }
  }
}

export type PopupMenuOptions = Omit<PopupMenuPluginProps, 'editor' | 'element'> & {
  element: HTMLElement | null,
}

export const PopupMenu = Extension.create<PopupMenuOptions>({
  name: 'popupMenu',

  addOptions() {
    return {
      element: null,
      tippyOptions: {},
      pluginKey: 'popupMenu',
      updateDelay: undefined,
      shouldShow: null,
    }
  },

  // @ts-ignore
  addCommands() {
    return {
      showPopupMenu: () => ({ view }) => {
        // @ts-ignore
        view.pluginViews.find((p) => p.pluginKey === this.options.pluginKey)._show()
      },
      hidePopupMenu: () => ({ view }) => {
        // @ts-ignore
        view.pluginViews.find((p) => p.pluginKey === this.options.pluginKey)._hide()
      },
    }
  },

  addProseMirrorPlugins() {
    if (!this.options.element) {
      return []
    }

    return [
      PopupMenuPlugin({
        pluginKey: this.options.pluginKey,
        editor: this.editor,
        element: this.options.element,
        tippyOptions: this.options.tippyOptions,
        updateDelay: this.options.updateDelay,
        shouldShow: this.options.shouldShow,
      }),
    ]
  },
})
