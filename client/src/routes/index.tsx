import React from 'react'
import { useCallback } from 'react'
import { createNotebook, joinJob, loadNotebook } from '../api';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row } from 'antd';
import { FileAddOutlined, UploadOutlined } from '@ant-design/icons';

export const Index = () => {
    const navigate = useNavigate();

    const navigateToNotebook = useCallback((notebookId: string) => {
        navigate(`/notebook/${notebookId}`);
    }, [navigate])

    const onNewNotebook = useCallback(async (name?: string) => {
        const notebookId = await createNotebook(
            name
        );
        navigateToNotebook(notebookId);
    }, [navigateToNotebook])

    const onLoadNotebook = useCallback(async () => {
        const jobId = await loadNotebook();
        const { error, output } = await joinJob<string>(jobId, jobId, () => { });

        if (error) return console.error("error", output);

        navigateToNotebook(output!);
    }, [navigateToNotebook])

    return (
        <Row gutter={8} style={{
            height: "100%",
            backgroundColor: "#eeeeee"
        }}
            align={"middle"}
            justify={"center"}
        >
            <Col span={8}>
                <Card
                    onClick={() => onNewNotebook()}
                    cover={<div className='h-96 !flex items-center justify-center bg-gray-200'>
                        <FileAddOutlined style={{
                            fontSize: "50px",
                        }} />
                    </div>
                    }
                >
                    <Card.Meta title="New notebook" />
                </Card>
            </Col>
            <Col span={8}>
                <Card
                    onClick={onLoadNotebook}
                    cover={
                        <div className='h-96 !flex items-center justify-center bg-gray-200'>
                            <UploadOutlined style={{
                                fontSize: "50px",
                            }} />
                        </div>
                    }
                >
                    <Card.Meta title="Load notebook" />
                </Card>
            </Col>
        </Row >
    )
}


