import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeInfo,
  Bird,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleHelp,
  Clock,
  Copy,
  Delete,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson2,
  FileSpreadsheet,
  FileWarning,
  GripVertical,
  Hash,
  HelpCircle,
  Info,
  ListFilter,
  Loader2,
  LucideMailbox,
  LucideTrash2,
  PauseCircle,
  Plus,
  PlusCircle,
  Redo,
  Repeat2,
  Scale,
  Search,
  Settings,
  Undo2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react'

export const Icons = {
  gripVertical: GripVertical,
  alertCircle: AlertCircle,
  arrowLeft: ArrowLeft,
  bird: Bird,
  calendar: Calendar,
  check: Check,
  delete: Delete,
  checkCircle: CheckCircle,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronsUpDown: ChevronsUpDown,
  circleHelp: CircleHelp,
  copy: Copy,
  clock: Clock,
  download: Download,
  dollarSign: DollarSign,
  externalLink: ExternalLink,
  fileJSON: FileJson2,
  fileSpreadsheet: FileSpreadsheet,
  fileWarning: FileWarning,
  filter: ListFilter,
  hash: Hash,
  helpCircle: HelpCircle,
  hide: EyeOff,
  info: BadgeInfo,
  infoCircle: Info,
  mail: LucideMailbox,
  pauseCircle: PauseCircle,
  plus: Plus,
  plusCircle: PlusCircle,
  redo: Redo,
  repeat: Repeat2,
  scale: Scale,
  search: Search,
  settings: Settings,
  spinner: Loader2,
  trash: LucideTrash2,
  warning: AlertTriangle,
  undo: Undo2,
  userPlus: UserPlus,
  view: Eye,
  x: X,
  xCircle: XCircle,
}

// guide for logos
// https://www.google.com/search?q=jakearchibald+svg&oq=jakearchibald+svg&sourceid=chrome&ie=UTF-8
// https://www.youtube.com/watch?v=MbUyHQRq2go&list=PL7CcGwsqRpSM3w9BT_21tUU8JN2SnyckR&index=12
export function Logo({
  className,
}: React.SVGAttributes<HTMLOrSVGElement>) {
  return (
    <svg
    className='h-[32px] w-[32px]'
      viewBox="0 0 53 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="53" height="53" fill="white" />
      <rect x="34" y="14" width="10" height="25" fill="black" />
      <rect x="9" y="14" width="10" height="25" fill="black" />
      <rect x="14" y="21.5" width="25" height="10" fill="black" />
      <rect x="14" y="21.5" width="5" height="10" fill="white" />
      <rect x="34" y="21.5" width="5" height="10" fill="white" />
    </svg>
  )
}
