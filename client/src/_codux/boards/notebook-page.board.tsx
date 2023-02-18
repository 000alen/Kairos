import { createBoard } from '@wixc3/react-board';
import { Notebook } from '../../routes/notebook';

export default createBoard({
    name: 'Notebook page',
    Board: () => (
        <Notebook />
    ),
});
