import { colorForHierarchy } from '../lib/colors'
import { Badge } from './ui'

export default function HierarchyBadge({ hierarchy }: { hierarchy: string }) {
  const color = colorForHierarchy(hierarchy || 'Unlabeled')
  return <Badge className={`${color.chipBg} ${color.text}`}>{hierarchy || 'Unlabeled'}</Badge>
}
