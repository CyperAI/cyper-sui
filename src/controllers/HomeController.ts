import { Request, Response } from 'express';

class HomeController {
    index(req: Request, res: Response) {
        const userAddress = req.session.suiAddress;
        const userInfo = req.session.userInfo;
        
        res.render('index.ejs', {
            userAddress: userAddress || null,
            userInfo: userInfo || null,
            title: 'Cyper - Where humans & AI flourish'
        });
    }

    store(req: Request, res: Response) {
        const userAddress = req.session.suiAddress;
        const userInfo = req.session.userInfo;
        
        res.render('store.ejs', {
            userAddress: userAddress || null,
            userInfo: userInfo || null,
            title: 'Cyper Store - Install Agents'
        });
    }
}

export default new HomeController();
