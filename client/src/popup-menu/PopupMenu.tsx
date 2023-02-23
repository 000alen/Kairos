import { Card, Skeleton } from 'antd';
import { PopupMenuPlugin, PopupMenuPluginProps } from '.'
import React, { useContext, useEffect, useState } from 'react'
import { CloseOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { NotebookContext } from '../routes/notebook';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type PopupMenuProps = Omit<Optional<PopupMenuPluginProps, 'pluginKey'>, 'element'> & {
  className?: string;
  // children: React.ReactNode;
  updateDelay?: number;

  // shown: boolean;
  // setShown: (shown: boolean) => void;
  // title: string;
  // description: string;
};

export const PopupMenu = (props: PopupMenuProps) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  const { popupTitle, popupDescription, popupShown, setPopupShown, insert } = useContext(NotebookContext)!;


  useEffect(() => {
    if (!element) return
    if (props.editor.isDestroyed) return

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

  useEffect(() => {
    if (!element) return
    if (props.editor.isDestroyed) return

    if (popupShown)
      props.editor.commands.showPopupMenu()
    else
      props.editor.commands.hidePopupMenu()

    return () => { props.editor.commands.hidePopupMenu() }
  }, [props.editor, popupShown])

  const actions = [
    <CloseOutlined key="setting" onClick={() => {
      setPopupShown(false)
    }} />,
    <EditOutlined key="edit" onClick={() => { insert(popupDescription!); setPopupShown(false) }} />,
  ]

  return (
    <div ref={setElement} className={props.className} style={{ visibility: 'hidden' }}>
      <Card
        style={{ width: 300 }}
        actions={actions}
      >
        <Card.Meta
          title={popupTitle}
          description={popupDescription}
        />
      </Card>
    </div>
  )
}
