import { PopupMenuPlugin, PopupMenuPluginProps } from '.'
import React, { useEffect, useState } from 'react'

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type PopupMenuProps = Omit<Optional<PopupMenuPluginProps, 'pluginKey'>, 'element'> & {
  className?: string;
  children: React.ReactNode;
  updateDelay?: number;
};

export const PopupMenu = (props: PopupMenuProps) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!element) {
      return
    }

    if (props.editor.isDestroyed) {
      return
    }

    const {
      pluginKey = 'popupMenu', editor, tippyOptions = {}, updateDelay, shouldShow = null,
    } = props

    const plugin = PopupMenuPlugin({
      updateDelay,
      editor,
      element,
      pluginKey,
      shouldShow,
      tippyOptions,
    })

    editor.registerPlugin(plugin)
    return () => editor.unregisterPlugin(pluginKey)
  }, [props.editor, element])

  return (
    <div ref={setElement} className={props.className} style={{ visibility: 'hidden' }}>
      {props.children}
    </div>
  )
}
