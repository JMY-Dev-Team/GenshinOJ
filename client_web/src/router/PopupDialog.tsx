import { MouseEventHandler, useCallback } from "react";

import {
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogTrigger,
    DialogSurface,
    DialogActions,
    DialogOpenChangeEvent,
    DialogOpenChangeData,
} from "@fluentui/react-components";

export default function PopupDialog({ text, open, setPopupDialogOpenState, onClose }: {
    text: string,
    open: boolean,
    setPopupDialogOpenState: React.Dispatch<React.SetStateAction<boolean>>,
    onClose?: MouseEventHandler<HTMLButtonElement> | undefined,
}) {
    const handleClose = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        if (onClose) onClose(event);
        setPopupDialogOpenState(false);
    }, [onClose, setPopupDialogOpenState]);

    const handleOpenChange = useCallback((_: DialogOpenChangeEvent, data: DialogOpenChangeData) => {
        setPopupDialogOpenState(data.open);
    }, [setPopupDialogOpenState]);

    return <Dialog modalType="alert" open={open} onOpenChange={handleOpenChange}>
        <DialogSurface>
            <DialogBody>
                <DialogContent>{text}</DialogContent>
                <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                        <Button appearance="primary" onClick={handleClose}>Close</Button>
                    </DialogTrigger>
                </DialogActions>
            </DialogBody>
        </DialogSurface>
    </Dialog>
}