import { createBoard } from '@wixc3/react-board';
import { Index } from '../../routes';

export default createBoard({
    name: 'Index page',
    Board: () => (
        <Index />
    ),
});
