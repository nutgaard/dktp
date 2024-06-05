export class Duration {
    static ofMilliSeconds(milliseconds: number): Duration {
        return new Duration(milliseconds);
    }
    static ofSeconds(seconds: number): Duration {
        return new Duration(seconds * 1000);
    }
    static ofMinutes(minutes: number): Duration {
        return Duration.ofSeconds(minutes * 60);
    }
    static ofHours(hours: number): Duration {
        return Duration.ofMinutes(hours * 60);
    }
    static ofDays(days: number): Duration {
        return Duration.ofHours(days * 24);
    }

    private milliseconds: number;

    private constructor(milliseconds: number) {
        this.milliseconds = Math.floor(milliseconds);
    }

    public asWholeMilliseconds(): number {
        return this.milliseconds;
    }

    public asWholeSeconds(): number {
        return Math.floor(this.milliseconds / 1000);
    }

    public asWholeMinutes(): number {
        return Math.floor(this.asWholeSeconds() / 60);
    }

    public asWholeHours(): number {
        return Math.floor(this.asWholeMinutes() / 60);
    }
}
