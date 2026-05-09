import Badge from './Badge.jsx';
import { getStatusColor, getStatusLabel } from '../../utils/helpers';

const StatusBadge = ({ status, size = 'sm' }) => {
  const color = getStatusColor(status);
  return (
    <Badge color={color} size={size} dot>
      {getStatusLabel(status)}
    </Badge>
  );
};

export default StatusBadge;
