import { IconButton } from '@ldclabs/component'
import { type AnchorProps } from '@ldclabs/util'

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
