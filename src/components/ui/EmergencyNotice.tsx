import { FaIcon } from "@/components/FaIcon";
import { faTriangleExclamation } from "@/lib/icons";

export function EmergencyNotice() {
  return (
    <aside className="emergency-notice" role="note" aria-label="Emergency information">
      <p className="emergency-notice-title">
        <FaIcon icon={faTriangleExclamation} className="emergency-notice-icon" aria-hidden />
        Is someone in immediate danger? Call Triple Zero (000).
      </p>
      <p className="small-text">
        BizWatch reports are not monitored as an emergency service.
      </p>
    </aside>
  );
}
