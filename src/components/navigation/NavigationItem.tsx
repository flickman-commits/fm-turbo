import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface NavigationItemProps {
  item: {
    name: string;
    icon: LucideIcon;
    path: string;
    beta?: boolean;
  };
  onClick?: () => void;
}

export function NavigationItem({ item, onClick }: NavigationItemProps) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;
  
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg mb-2
        transition-colors duration-200
        ${isActive 
          ? 'bg-turbo-blue text-turbo-beige' 
          : 'text-turbo-black hover:bg-turbo-black/5'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <div className="flex items-center gap-2">
        <span className="font-medium">{item.name}</span>
        {item.beta && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-turbo-blue/20 rounded">
            BETA
          </span>
        )}
      </div>
    </Link>
  );
} 