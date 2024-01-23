import { IconButton } from '@nsm-web/component'
import { type AnchorProps } from '@nsm-web/util'

export function renderIconMoreAnchor(props: AnchorProps) {
  return (
    <IconButton
      iconName='more'
      shape='rounded'
      size='medium'
      iconSize='medium'
      {...props}
    />
  )
}
